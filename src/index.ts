import * as express from 'express';
import * as bodyParser from 'body-parser';
import slackRoutes from './routes/slack';
import xPoweredByMiddleware from './middlewares/x-powered-by';
import expressUGCProxyMiddleware from './middlewares/express-ugc-proxy';

const host = String(process.env.HOST || '127.0.0.1');
const port = Number(process.env.PORT || 7890);
const app = express();

app.enable('trust proxy');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(xPoweredByMiddleware());
app.use('/ugc-files', expressUGCProxyMiddleware());
app.use('/', slackRoutes());

app.get('/favicon.ico', (_, res) =>
    res.redirect(301, 'https://www.xboxreplay/net/favicon.ico')
);

app.get('*', (_, res) =>
    res.redirect(301, 'https://github.com/XboxReplay/slack-bot')
);

app.listen(port, host, err => {
    if (err) throw err;
    else console.info(`> Listening at http://${host}:${port}`);
});
