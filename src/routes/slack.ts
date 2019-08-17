import * as request from 'request';
import slackConfig from '../config/slack';
import fetchFile from '../modules/fetch-xbox-file';
import { Router, Request, Response } from 'express';
import { stringify } from 'querystring';

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

const onFetchXboxFile = async (req: Request, res: Response) => {
    const { body } = req;

    if (body === void 0) {
        return res.sendStatus(400);
    }

    const { text = '', channel_id = null } = body;

    if (text.length === 0 || channel_id === null) {
        return res.sendStatus(400);
    }

    const explode = text.split(' ');
    const type = explode[0] || null;
    const gamertag = explode.slice(1).join(' ') || null;

    if (type === null || gamertag === null) {
        return res.sendStatus(400);
    } else if (['gameclip', 'screenshot'].includes(type) === false) {
        return res.sendStatus(400);
    }

    fetchFile(type, gamertag)
        .then(response => {
            if (response === null) {
                return res.sendStatus(404);
            }

            const domain = req.protocol + '://' + req.get('host');

            return res.send({
                response_type: 'in_channel',
                channel: body.channel_id,
                attachments: [
                    {
                        color: '#198e14',
                        author_name: `${
                            response.player_gamertag.endsWith('s')
                                ? `${response.player_gamertag}' ${type}`
                                : `${response.player_gamertag}'s ${type}`
                        }`,
                        author_link: response.xboxreplay_url,
                        author_icon: response.player_picture,
                        title: response.title_name,
                        title_link: response.xboxreplay_url,
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
        .catch(() => res.sendStatus(500));
};

export default () => {
    const router = Router();
    router.get('/slack/oauth-callback', onOAuthCallback);
    router.post('/slack/fetch-xbox-file', onFetchXboxFile);
    return router;
};
