import 'regenerator-runtime/runtime';
import { Readable, Writable } from 'stream';

function createTransformedStream(eventStream, transforms) {
    return transforms.reduce((eventStream, transform) => eventStream.pipe(transform), eventStream);
}

export default ({ storage, bus, transforms = [] }) => ({
    async subscribeByEventType(eventTypes, handler) {
        await storage.loadEventsByTypes(eventTypes, handler);

        return bus.onEvent(eventTypes, handler);
    },

    getStreamByAggregateId(aggregateId, handler) {
        //return storage.loadEventsByAggregateId(aggregateId, handler);

        const eventStream = Readable({ objectMode: true, read() {} });
        (async () => {
            try {
                await storage.loadEventsByAggregateId(aggregateId, event =>
                    eventStream.push(event)
                );
                eventStream.push(null);
            } catch (error) {
                eventStream.emit('error', error);
            }
        })();
        return createTransformedStream(eventStream, transforms);
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
