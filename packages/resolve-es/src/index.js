import 'regenerator-runtime/runtime';
import { Readable, Writable } from 'stream';

function createTransformedStream(eventStream, transforms) {
    return transforms.reduce((eventStream, transform) => eventStream.pipe(transform), eventStream);
}

export default ({ storage, bus, transforms = [] }) => ({
    getStreamByEventTypes(eventTypes) {
        const eventStream = Readable({ objectMode: true, read() {} });
        (async () => {
            try {
                await storage.loadEventsByTypes(eventTypes, event => eventStream.push(event));

                // Custom events are allowed due ReadableStream is inherited from EventEmitter
                // https://github.com/nodejs/node/blob/master/lib/internal/streams/legacy.js#L9
                eventStream.emit('storageDone', true);

                bus.onEvent(eventTypes, event => eventStream.push(event));
            } catch (error) {
                eventStream.emit('error', error);
            }
        })();
        return createTransformedStream(eventStream, transforms);
    },
    getStreamByAggregateId(aggregateId) {
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
