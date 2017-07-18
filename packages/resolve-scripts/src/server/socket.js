import { subscribe } from './event_store';

const config = require('RESOLVE_CONFIG');

export default socket => {
    console.log('Socket connected');
    const eventsNames = Object.keys(config.events).map(key => config.events[key]);
    const unsubscribe = subscribe(eventsNames, event =>
        socket.emit('event', JSON.stringify(event)))

    socket.on('disconnect', unsubscribe);
}
