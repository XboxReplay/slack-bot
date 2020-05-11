import axios from 'axios';
import config from '../config';

export const seachFiles = async (
	gamertag: string,
	target: 'screenshots' | 'clips',
	limit = 1
) =>
	axios({
		url: `https://api.xboxreplay.net/search/game-dvr?target=${target}&gamertag=${encodeURIComponent(
			gamertag
		)}&limit=${limit}`,
		headers: {
			Authorization: [
				config.xboxreplay.authorizationType,
				config.xboxreplay.authorizationCredentials
			].join(' ')
		}
	}).then(response => response.data);
