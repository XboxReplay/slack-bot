import { Response, Request, NextFunction } from 'express';

export default () => (_: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Powered-By', 'XboxReplay.net');
    return next();
};
