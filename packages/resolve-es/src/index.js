import 'regenerator-runtime/runtime';
import { Writable } from 'stream';

export default ({ storage, bus, transforms = [] }) => ({
    async subscribeByEventType(eventTypes, handler) {
        await storage.loadEventsByTypes(eventTypes, handler);

        return bus.onEvent(eventTypes, handler);
    },

    getEventsByAggregateId(aggregateId, handler) {
        return storage.loadEventsByAggregateId(aggregateId, handler);
    },

    getPublishStream() {
        return Writable({
            objectMode: true,
            async write(event, encoding, callback) {
                try {
                    await storage.saveEvent(event);
                    await bus.emitEvent(event);
                    callback();
                } catch (error) {
                    callback(error);
                }
            }
        });
    }
});
