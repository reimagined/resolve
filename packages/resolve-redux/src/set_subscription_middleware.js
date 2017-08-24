import socketIOClient from 'socket.io-client';

const CRITICAL_LEVEL = 100;

export default ({ rootDirPath }) => (store) => {
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
        const { type, types, ids } = action;

        if (type === 'SET_SUBSCRIPTION' && Array.isArray(types) && Array.isArray(ids)) {
            socketIO.emit('setSubscription', {
                types: action.types || [],
                ids: action.ids || []
            });
        }

        return next(action);
    };
};
