import { subscribe } from './event_store';
import config from '../configs/server.config.js';

export default (socket) => {
    // eslint-disable-next-line no-console
    console.log('Socket connected');
    const eventsNames = Object.keys(config.events).map(key => config.events[key]);
    subscribe(eventsNames, event => socket.emit('event', JSON.stringify(event))).then(unsubscribe =>
        socket.on('disconnect', unsubscribe)
    );
};
