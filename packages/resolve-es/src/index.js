import { Readable, Writable } from 'stream';

export default ({ storage, bus }) => ({
    getStreamByEventTypes(eventTypes) {
        const eventStream = Readable({ objectMode: true, read() {} });
        storage
            .loadEventsByTypes(eventTypes, event => eventStream.push(event))
            .then(() => bus.onEvent(eventTypes, event => eventStream.push(event)))
            .catch(error => eventStream.emit('error', error));
        return eventStream;
    },
    getStreamByAggregateId(aggregateId) {
        const eventStream = Readable({ objectMode: true, read() {} });
        storage
            .loadEventsByAggregateId(aggregateId, event => eventStream.push(event))
            .then(() => eventStream.push(null))
            .catch(error => eventStream.emit('error', error));
        return eventStream;
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
