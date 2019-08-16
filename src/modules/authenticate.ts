import * as XboxLiveAuth from '@xboxreplay/xboxlive-auth';
import { getFromStore, setToStore } from './memory-store';
import credentials from '../config/credentials';

type StoreResponse = XboxLiveAuth.AuthUserResponse | null;

const storeKey = 'xboxreplay:xboxlive-authorization';
const extractRequiredParameters = (
    authorization: XboxLiveAuth.AuthUserResponse
) => ({
    userHash: authorization.userHash,
    XSTSToken: authorization.XSTSToken
});

export default async () => {
    const authorization = getFromStore<StoreResponse>(storeKey);

    if (authorization !== null) {
        const hasExpired = new Date(authorization.expiresOn) <= new Date();

        if (hasExpired === false) {
            return extractRequiredParameters(authorization);
        }
    }

    const authenticateResponse = await XboxLiveAuth.authenticate(
        credentials.email,
        credentials.password
    );

    setToStore(storeKey, authenticateResponse);
    return extractRequiredParameters(authenticateResponse);
};
