import { SET_SUBSCRIPTION } from './actions';
import socketIOClient from 'socket.io-client';

const CRITICAL_LEVEL = 100;

function getRootDir(params) {
    if (params.rootDirPath) {
        return params.rootDirPath;
    }

    return typeof process !== 'undefined' &&
        typeof process.env !== 'undefined' &&
        process.env.ROOT_DIR
        ? process.env.ROOT_DIR
        : '';
}

function createMiddleware(params = {}) {
    return (store) => {
        let socketIOFailCount = 0;
        let socketIO = null;

        const rootDir = getRootDir(params);

        const initSocketIO = () => {
            socketIO = socketIOClient(window.location.origin, {
                path: `${rootDir}/socket/`
            });

            socketIO.on('event', event => store.dispatch(JSON.parse(event)));

            socketIO.on('disconnect', () => {
                socketIOFailCount++;
                if (socketIOFailCount > CRITICAL_LEVEL) {
                    window.location.reload();
                }
                initSocketIO();
            });
        };

        initSocketIO();

        return next => (action) => {
            const { type, types, ids } = action;
            if (type === SET_SUBSCRIPTION) {
                socketIO.emit('setSubscription', {
                    types: types || [],
                    ids: ids || []
                });
            }

            return next(action);
        };
    };
}

const middleware = typeof window === 'undefined'
    ? () => () => next => action => next(action)
    : createMiddleware;

export default middleware;
