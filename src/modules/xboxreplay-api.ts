import axios from 'axios';

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
				process.env.XR_AUTHORIZATION_TYPE || '',
				process.env.XR_AUTHORIZATION_CREDENTIALS || ''
			].join(' ')
		}
	}).then(response => response.data);
