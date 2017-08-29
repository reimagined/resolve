import { SET_SUBSCRIPTION } from './actions';
import socketIOClient from 'socket.io-client';

const CRITICAL_LEVEL = 100;

function createMiddleware({ rootDirPath }) {
    return (store) => {
        let socketIOFailCount = 0;
        let socketIO = null;

        const initSocketIO = () => {
            socketIO = socketIOClient(window.location.origin, {
                path: `${rootDirPath}/socket/`
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
            if (action.type === SET_SUBSCRIPTION) {
                socketIO.emit('setSubscription', {
                    types: action.types || [],
                    ids: action.ids || []
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
