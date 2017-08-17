import 'regenerator-runtime/runtime';

export default (
    config,
    errorHandler = (err) => {
        throw err;
    }
) => {
    const eventHandlersMap = new Map();
    function trigger(event) {
        const handlers = eventHandlersMap.get(event.type) || [];
        handlers.forEach(handler => handler(event));
    }

    config.bus.setTrigger(trigger);

    const onEvent = (eventTypes, callback) => {
        eventTypes.forEach((eventType) => {
            const handlers = eventHandlersMap.get(eventType) || [];
            handlers.push(callback);
            eventHandlersMap.set(eventType, handlers);
        });

        return () => {
            eventTypes.forEach((eventType) => {
                const handlers = eventHandlersMap.get(eventType).filter(item => item !== callback);
                eventHandlersMap.set(eventType, handlers);
            });
        };
    };

    const result = {
        async subscribeByEventType(eventTypes, handler) {
            await config.storage.loadEventsByTypes(eventTypes, handler);
            return onEvent(eventTypes, handler);
        },

        async getEventsByAggregateId(aggregateId, handler) {
            return await config.storage.loadEventsByAggregateId(aggregateId, handler);
        },

        async onEvent(eventTypes, callback) {
            return await onEvent(eventTypes, callback);
        },

        async saveEvent(event) {
            await config.storage.saveEvent(event);
            await config.bus.publish(event);
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
