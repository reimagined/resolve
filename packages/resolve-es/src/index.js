import 'regenerator-runtime/runtime';

export default (
    config,
    errorHandler = (err) => {
        throw err;
    }
) => ({
    async subscribeByEventType(eventTypes, handler) {
        try {
            await config.storage.loadEventsByTypes(eventTypes, handler);

            return config.bus.onEvent(eventTypes, handler);
        } catch (err) {
            errorHandler(err);
        }
    },

    getEventsByAggregateId(aggregateId, handler) {
        try {
            return config.storage.loadEventsByAggregateId(aggregateId, handler);
        } catch (err) {
            errorHandler(err);
        }
    },

    onEvent(eventTypes, callback) {
        try {
            return config.bus.onEvent(eventTypes, callback);
        } catch (err) {
            errorHandler(err);
        }
    },

    async saveEvent(event) {
        try {
            await config.storage.saveEvent(event);
            await config.bus.emitEvent(event);
            return event;
        } catch (err) {
            errorHandler(err);
        }
    }
});
