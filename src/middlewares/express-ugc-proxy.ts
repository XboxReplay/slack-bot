import * as UGCMiddleware from '@xboxreplay/express-ugc-proxy';
import XBLAuthenticateMethod from '../modules/authenticate';

export default () =>
    UGCMiddleware.handle(XBLAuthenticateMethod, {
        redirectOnFetch: true,
        debug: true,
        fileTypesMapping: {
            gameclips: 'gameclip',
            screenshots: 'screenshot'
        }
    });
