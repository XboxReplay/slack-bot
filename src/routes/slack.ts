import { Router, Request, Response } from 'express';
import { stringify } from 'querystring';
import slackConfig from '../config/slack';
import requestConfig from '../config/request';
import fetchFile from '../modules/fetch-file';
import * as request from 'request';

const onOAuthCallback = (req: Request, res: Response) => {
    const { code = '' } = req.query;

    if (code.length === 0 || typeof code !== 'string') {
        return res.sendStatus(400);
    }

    request(
        {
            uri: 'https://slack.com/api/oauth.access',
            method: 'POST',
            gzip: true,
            headers: { 'User-Agent': requestConfig.userAgent },
            body: stringify({
                client_id: slackConfig.clientId,
                client_secret: slackConfig.clientSecret,
                code
            })
        },
        (err: any, response: request.Response, body: any) => {
            if (err) return res.sendStatus(500);
            else if (response.statusCode !== 200)
                return res.sendStatus(response.statusCode);
            return res.send(JSON.parse(body));
        }
    );
};

const onFetchXboxFile = (req: Request, res: Response) => {
    const { body } = req;

    if (body === void 0) {
        return res.status(400).send('Missing "body" in request');
    }

    const text = body.text || '';
    const channel_id = body.channel_id || null;

    if (text.length === 0) {
        return res.status(400).send('Missing "text" in request body');
    } else if (channel_id === null) {
        return res.status(400).send('Missing "channel_id" in request body');
    }

    const explode = text.split(' ');
    const type = explode[0] || null;
    const gamertag = explode.slice(1).join(' ') || null;

    if (type === null) {
        return res.status(400).send('Missing file type');
    } else if (gamertag === null) {
        return res.status(400).send('Missing gamertag');
    } else if (['gameclip', 'screenshot'].includes(type) === false) {
        return res.status(400).send('Non-supported file type supplied');
    }

    fetchFile(type, gamertag)
        .then(response => {
            if (response === null) {
                return res.status(404);
            }

            const domain = req.protocol + '://' + req.get('host');

            return res.status(200).send({
                response_type: 'in_channel',
                channel: body.channel_id,
                attachments: [
                    {
                        color: '#198e14',
                        author_name: `${response.gamertag} shared a ${type}`,
                        author_link: `https://www.xboxreplay.net/player/${
                            response.gamertag
                        }/${type === 'gameclip' ? 'clips' : 'screenshots'}/${
                            response.id
                        }`,
                        author_icon: response.picture,
                        title: response.title,
                        title_link: `https://www.xboxreplay.net/player/${
                            response.gamertag
                        }/${type === 'gameclip' ? 'clips' : 'screenshots'}/${
                            response.id
                        }`,
                        image_url: `${domain}${response.preview_path}`,
                        actions: [
                            {
                                type: 'button',
                                text: type === 'gameclip' ? 'Play' : 'Download',
                                url: `${domain}${response.download_path}`,
                                style: 'primary'
                            }
                        ]
                    }
                ]
            });
        })
        .catch(() => res.status(500).send('Something went wrong...'));
};

export default () => {
    const router = Router();

    router.get('/slack/oauth-callback', (req: Request, res: Response) => {
        // prettier-ignore
        try { return onOAuthCallback(req, res); }
        catch (err) {
            console.error(err);
            return res.status(500).send(err.message);
        }
    });

    router.post('/slack/fetch-xbox-file', (req: Request, res: Response) => {
        // prettier-ignore
        try { return onFetchXboxFile(req, res); }
        catch (err) {
            console.error(err);
            return res.status(500).send(err.message);
        }
    });

    return router;
};
