import UGCMiddlewareConfig from '../config/express-ugc-middleware';
import { Router, Request, Response } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';
import { HMACSHA1 } from '../modules/utils';

let mediaPlayerFileData: string | null = null;

const handlePlayer = (req: Request, res: Response) => {
	const { data = null } = req.query;

	if (data === null) {
		return res.sendStatus(400);
	}

	const parameters = Buffer.from(data, 'base64').toString('ascii');
	const { gt = '', xuid = '', scid = '', id = '', sign = '' } = (() => {
		// prettier-ignore
		try { return JSON.parse(parameters); }
        catch (err) { return {}; }
	})();

	if ([gt, xuid, scid, id, sign].includes('')) {
		return res.sendStatus(400);
	} else if (sign !== HMACSHA1(JSON.stringify({ gt, xuid, scid, id }))) {
		return res.sendStatus(400);
	}

	const basePath = join(
		'ugc-files',
		UGCMiddlewareConfig.fileTypesMapping.gameclips,
		xuid.replace(/[^a-z0-9]/gi, ''),
		scid.replace(/[^a-z0-9\-]/gi, ''),
		id.replace(/[^a-z0-9\-]/gi, '')
	);

	const thumbnail = `/${basePath}/thumbnail-large.png`;
	const gameclip = `/${basePath}/gameclip.mp4`;
	const mediaPlayerTemplate = join(
		__dirname,
		'..',
		'..',
		'templates',
		'media-player.html'
	);

	mediaPlayerFileData =
		mediaPlayerFileData === null
			? readFileSync(mediaPlayerTemplate, 'utf-8')
			: mediaPlayerFileData;

	return res.send(
		mediaPlayerFileData
			.replace('{VIDEO_POSTER}', thumbnail)
			.replace('{VIDEO_SRC}', gameclip)
			.replace(
				'{XBOXREPLAY_MEDIA_URL}',
				`https://www.xboxreplay.net/player/${encodeURIComponent(
					gt
				)}/clips/${id}`
			)
	);
};

export default () => {
	const router = Router();
	router.get('/', handlePlayer);
	return router;
};
