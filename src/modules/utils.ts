import * as crypto from 'crypto';

export const HMACSHA1 = (entry: string) =>
    crypto
        .createHmac('sha1', process.env.MEDIA_PLAYER_KEY || '')
        .update(entry)
        .digest('hex');
