import axios from 'axios';
import config from '../../../config';
import { Request, Response, Router } from 'express';
import { seachFiles } from '../../../modules/xboxreplay-api';

const createErrorMessage = (message = 'Something went wrong...') => ({
	response_type: 'ephemeral',
	text: `*Error:* ${message}`
});

const onOAuthCallback = (req: Request, res: Response) => {
	const { code = '' } = req.query;

	if (code.length === 0 || typeof code !== 'string') {
		return res.sendStatus(400);
	}

	return axios({
		url: 'https://slack.com/api/oauth.access',
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		data: {
			client_id: config.slack.clientId,
			client_secret: config.slack.clientSecret,
			code
		}
	})
		.then(response => {
			return res.send(
				typeof response.data === 'string'
					? JSON.parse(response.data)
					: response.data
			);
		})
		.catch(err => {
			console.error(err);
			return res.sendStatus(err?.response.status || 500);
		});
};

const onFetchXboxFile = async (req: Request, res: Response) => {
	const { body } = req;

	if (body === void 0) {
		return res.sendStatus(400);
	}

	const { text = '', channel_id = null } = body;

	if (text.length === 0) {
		return res.send(createErrorMessage('Empty parameters'));
	} else if (channel_id === null) return res.sendStatus(400);

	const explodeEntry = text.split(' ');
	const gamertag = explodeEntry.slice(1).join(' ') || null;

	let type = explodeEntry[0] || null;

	if (type === null || gamertag === null) {
		return res.send(
			createErrorMessage('Some required parameters are missing')
		);
	}

	const explodeType = type.split('-');
	const position = explodeType[1] || 1;

	type = explodeType[0];

	if (type === 'g') type = 'gameclip';
	else if (type === 's') type = 'screenshot';
	else if (['gameclip', 'screenshot'].includes(type) === false) {
		return res.send(
			createErrorMessage(
				'Please specify a valid type [ gameclip | screenshot ]'
			)
		);
	}

	if (position > 100 || position < 0) {
		return res.send(
			createErrorMessage(
				position > 100
					? 'Position must be less than or equal to 100'
					: 'Position must be larger than or equal to 1'
			)
		);
	}

	return seachFiles(
		gamertag,
		type === 'gameclip' ? 'clips' : 'screenshots',
		position
	)
		.then(response => {
			const item = response.data[position - 1];

			if (item === void 0) {
				return res.send(
					createErrorMessage(
						'No Game DVR items found for the targeted gamertag'
					)
				);
			}

			const escapedGamertag = item.author.gamertag
				.replace(/ +/g, '-')
				.toLowerCase();

			return res.send({
				response_type: 'in_channel',
				channel: body.channel_id,
				attachments: [
					{
						color: '#198e14',
						author_name: item.author.gamertag.endsWith('s')
							? `${item.author.gamertag}' ${
									type === 'screenshot' ? 'screnshot' : 'clip'
							  }`
							: `${item.author.gamertag}'s ${
									type === 'screenshot' ? 'screnshot' : 'clip'
							  }`,
						author_link: `https://www.xboxreplay.net/player/${escapedGamertag}`,
						author_icon: item.author.gamerpic,
						title: item.game.name,
						// title_link: response.xboxreplay.gameUrl,
						image_url: item.thumbnail_urls.large,
						actions: [
							{
								type: 'button',
								text:
									type === 'gameclip'
										? '▶️ Play'
										: '⏬ Download',
								url:
									type === 'screenshot'
										? item.download_urls.source
										: `https://play.xboxreplay.net?gamertag=${escapedGamertag}&id=${item.id}&embed=false&type=video&autoplay=true`,
								style: 'primary'
							}
						]
					}
				]
			});
		})
		.catch(() => res.send(createErrorMessage()));
};

export default () => {
	const router = Router();
	router.get('/oauth-callback', onOAuthCallback);
	router.post('/fetch-xbox-file', onFetchXboxFile);
	return router;
};
