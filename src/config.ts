export default {
	slack: {
		clientId: String(process.env.SLACK_CLIENT_ID || ''),
		clientSecret: String(process.env.SLACK_CLIENT_SECRET || '')
	},
	xboxreplay: {
		authorizationType: String(process.env.XR_AUTHORIZATION_TYPE || ''),
		authorizationCredentials: String(
			process.env.XR_AUTHORIZATION_CREDENTIALS || ''
		)
	}
};
