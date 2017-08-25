import { subscribe } from './event_store';
import config from '../configs/server.config.js';

export default (socket) => {
    // eslint-disable-next-line no-console
    console.log('Socket connected');
    const emitter = event => socket.emit('event', JSON.stringify(event));

    let unsubscribePromise = subscribe(config.initialEvents, emitter);
    const unsubscribe = () => {
        if (unsubscribePromise) {
            unsubscribePromise.then(unsubCallback => unsubCallback());
            unsubscribePromise = null;
        }
    };

    socket.on('setSubscription', (eventsDescription) => {
        unsubscribe();
        const filteredEventsDescription = config.filterSubscription(
            eventsDescription,
            socket.request
        );
        subscribe(filteredEventsDescription, emitter);
    });

    socket.on('disconnect', unsubscribe);
};
