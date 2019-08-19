import * as UGCMiddleware from '@xboxreplay/express-ugc-proxy';
import UGCMiddlewareConfig from '../config/express-ugc-middleware';
import XBLAuthenticateMethod from '../modules/authenticate';

export default () =>
    UGCMiddleware.handle(XBLAuthenticateMethod, UGCMiddlewareConfig);
