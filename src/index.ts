import * as express from 'express';
import * as bodyParser from 'body-parser';
import slackRoutes from './routes/slack';
import expressUGCProxy from './middlewares/express-ugc-proxy';

const host = String(process.env.HOST || '127.0.0.1');
const port = Number(process.env.PORT || 7890);
const app = express();

app.enable('trust proxy');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((_, res, next) => {
    res.setHeader('X-Powered-By', 'XboxReplay.net');
    return next();
});

app.use('/', slackRoutes());
app.use('/ugc-files', expressUGCProxy());
app.get('*', (_, res) => res.sendStatus(404));

app.listen(port, host, err => {
    if (err) throw err;
    else console.info(`> Listening at http://${host}:${port}`);
});
