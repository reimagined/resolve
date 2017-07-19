import { subscribe } from './event_store';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_CONFIG';

export default (socket) => {
    // eslint-disable-next-line no-console
    console.log('Socket connected');
    const eventsNames = Object.keys(config.events).map(key => config.events[key]);
    const unsubscribe = subscribe(eventsNames, event =>
        socket.emit('event', JSON.stringify(event))
    );

    socket.on('disconnect', unsubscribe);
};
