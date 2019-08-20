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
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
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

    if (text.length === 0) {
        return res.send({
            type: 'ephemeral',
            text: 'Error: Empty parameters'
        });
    } else if (channel_id === null) return res.sendStatus(400);

    const explodeEntry = text.split(' ');
    const gamertag = explodeEntry.slice(1).join(' ') || null;

    let type = explodeEntry[0] || null;

    if (type === null || gamertag === null) {
        return res.send({
            response_type: 'ephemeral',
            text:
                type === null
                    ? 'Error: Please specify a valid type [ gameclip | screenshot ]'
                    : 'Error: Please specify a gamertag'
        });
    }

    const explodeType = type.split('-');
    const position = explodeType[1] || 1;

    if (position > 100 || position < 0) {
        // Max items
        return res.send({
            response_type: 'ephemeral',
            text:
                position > 100
                    ? 'Error: Position must be less than or equal to 100'
                    : 'Error: Position must be larger than or equal to 1'
        });
    }

    type = explodeType[0];

    if (type === 'g') type = 'gameclip';
    else if (type === 's') type = 'screenshot';
    else if (['gameclip', 'screenshot'].includes(type) === false) {
        return res.send({
            response_type: 'ephemeral',
            text: 'Error: Please specify a valid type [ gameclip | screenshot ]'
        });
    }

    fetchFile(type, gamertag, position)
        .then(response => {
            if (response === null) {
                return res.send({
                    response_type: 'ephemeral',
                    text: 'Error: No items found for the targeted gamertag'
                });
            }

            const domain = req.protocol + '://' + req.get('host');

            return res.send({
                response_type: 'in_channel',
                channel: body.channel_id,
                attachments: [
                    {
                        color: '#198e14',
                        author_name: response.player.name.endsWith('s')
                            ? `${response.player.name}' ${type}`
                            : `${response.player.name}'s ${type}`,
                        author_link: response.xboxreplay.profileUrl,
                        author_icon: response.player.pictureUrl,
                        title: response.item.titleName,
                        title_link: response.xboxreplay.gameUrl,
                        image_url: `${domain}${response.item.previewPath}`,
                        actions: [
                            {
                                type: 'button',
                                text:
                                    type === 'gameclip'
                                        ? '▶️ Play'
                                        : '⏬ Download',
                                url: `${domain}${response.item.actionPath}`,
                                style: 'primary'
                            }
                        ]
                    }
                ]
            });
        })
        .catch(() =>
            res.send({
                response_type: 'ephemeral',
                text: 'Error: Something went wrong...'
            })
        );
};

export default () => {
    const router = Router();
    router.get('/oauth-callback', onOAuthCallback);
    router.post('/fetch-xbox-file', onFetchXboxFile);
    return router;
};
