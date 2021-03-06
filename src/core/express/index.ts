import express from 'express';
import bodyParser from 'body-parser';
import slackRoutes from './routes/slack';
import config from './config';

const host = String(config.host);
const port = Number(config.port);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/slack', slackRoutes());

app.get('/favicon.ico', (_, res) =>
	res.redirect(301, 'https://www.xboxreplay.net/favicon.ico')
);

app.get('*', (_, res) =>
	res.redirect(
		301,
		'https://slack.com/oauth/v2/authorize?client_id=2566335526.166839191841&scope=chat:write,commands'
	)
);

app.listen(port, host, err => {
	if (err) throw err;
	else console.info(`> Listening at http://${host}:${port}`);
});
