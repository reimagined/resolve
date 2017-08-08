import 'regenerator-runtime/runtime';

export default (
    config,
    errorHandler = (err) => {
        throw err;
    }
) => {
    const result = {
        async subscribeByEventType(eventTypes, handler) {
            await config.storage.loadEventsByTypes(eventTypes, handler);
            return config.bus.onEvent(eventTypes, handler);
        },

        async getEventsByAggregateId(aggregateId, handler) {
            return await config.storage.loadEventsByAggregateId(aggregateId, handler);
        },

        onEvent(eventTypes, callback) {
            return config.bus.onEvent(eventTypes, callback);
        },

        async saveEvent(event) {
            await config.storage.saveEvent(event);
            await config.bus.emitEvent(event);
            return event;
        }
    };

    return Object.keys(result).reduce((acc, methodName) => {
        acc[methodName] = async (...args) => {
            try {
                return await result[methodName](...args);
            } catch (err) {
                errorHandler(err);
            }
        };

        return acc;
    }, {});
};
