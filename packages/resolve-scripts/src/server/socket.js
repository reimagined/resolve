import { subscribe } from './event_store';
import config from '../configs/server.config.js';

export default (socket) => {
    const emitter = event => socket.emit('event', JSON.stringify(event));

    let unsubscribePromise = subscribe(config.initialSubscribedEvents, emitter);
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
        unsubscribePromise = subscribe(filteredEventsDescription, emitter);
    });

    socket.on('disconnect', unsubscribe);
};
