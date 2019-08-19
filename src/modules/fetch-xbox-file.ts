import * as XboxLiveAPI from '@xboxreplay/xboxlive-api';
import XBLAuthenticateMethod from './authenticate';
import { stringify } from 'querystring';

const fetchPlayerInfo = async (
    gamertag: string,
    authorization: XboxLiveAPI.XBLAuthorization
) => {
    const playerSettings = await XboxLiveAPI.getPlayerSettings(
        gamertag,
        authorization,
        ['Gamertag', 'GameDisplayPicRaw']
    );

    const [gamertagNode, pictureNode] = [
        playerSettings.find(setting => setting.id === 'Gamertag'),
        playerSettings.find(setting => setting.id === 'GameDisplayPicRaw')
    ];

    return {
        gamertag: gamertagNode ? gamertagNode.value : null,
        picture: pictureNode ? pictureNode.value : null
    };
};

const fetchFiles = (
    type: string,
    gamertag: string,
    authorization: XboxLiveAPI.XBLAuthorization
) =>
    XboxLiveAPI[
        type === 'gameclip' ? 'getPlayerGameclips' : 'getPlayerScreenshots'
    ](gamertag, authorization, { maxItems: 1 });

export default async (type: string, gamertag: string) => {
    const authorization = await XBLAuthenticateMethod();

    const [playerInfo, playerFiles] = await Promise.all([
        fetchPlayerInfo(gamertag, authorization),
        fetchFiles(type, gamertag, authorization) as any
    ]).catch(() => [null, null]);

    if (playerInfo === null || playerFiles === null) {
        return null;
    }

    const fileMetadata =
        type === 'gameclip'
            ? (playerFiles as { gameClips: XboxLiveAPI.GameclipNode[] })
                  .gameClips[0]
            : (playerFiles as { screenshots: XboxLiveAPI.ScreenshotNode[] })
                  .screenshots[0];

    if (fileMetadata === void 0) {
        return null;
    }

    // prettier-ignore
    const [fileId, fileName] =
        type === 'gameclip'
            ? [(fileMetadata as XboxLiveAPI.GameclipNode).gameClipId, 'gameclip.mp4']
            : [(fileMetadata as XboxLiveAPI.ScreenshotNode).screenshotId, 'screenshot.png'];

    const proxyPath = `/ugc-files/${type}/${fileMetadata.xuid}/${
        fileMetadata.scid
    }/${fileId}`;

    const hashProperties = {
        xuid: fileMetadata.xuid,
        scid: fileMetadata.scid,
        id: fileId
    };

    return {
        xboxreplay: {
            gameUrl: `https://www.xboxreplay.net/games/${fileMetadata.titleId}`,
            mediaUrl: `https://www.xboxreplay.net/player/${playerInfo.gamertag ||
                gamertag}/${
                type === 'gameclip' ? 'clips' : 'screenshots'
            }/${fileId}`,
            profileUrl: `https://www.xboxreplay.net/player/${playerInfo.gamertag ||
                gamertag}`
        },
        player: {
            name: playerInfo.gamertag || gamertag,
            pictureUrl:
                playerInfo.picture !== null
                    ? `${playerInfo.picture.replace(
                          'http://images-eds.xboxlive.com',
                          'https://images-eds-ssl.xboxlive.com'
                      )}&h=120&w=120`
                    : null
        },
        item: {
            titleName: fileMetadata.titleName,
            previewPath: `${proxyPath}/thumbnail-large.png`,
            actionPath:
                type === 'gameclip'
                    ? `/media-player?hash=${Buffer.from(
                          JSON.stringify(hashProperties)
                      ).toString('base64')}`
                    : `${proxyPath}/${fileName}`
        }
    };
};
