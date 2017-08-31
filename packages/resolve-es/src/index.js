import 'regenerator-runtime/runtime';

export default (
    config,
    errorHandler = (err) => {
        throw err;
    }
) => {
    const eventHandlersMap = { types: new Map(), ids: new Map() };

    function trigger(event) {
        const handlersByType = eventHandlersMap.types.get(event.type) || [];
        const handlersById = eventHandlersMap.ids.get(event.aggregateId) || [];
        handlersByType.concat(handlersById).forEach(handler => handler(event));
    }

    config.bus.setTrigger(trigger);

    const onEvent = (eventMap, eventDescriptors, callback) => {
        eventDescriptors.forEach((eventDescriptor) => {
            const handlers = eventMap.get(eventDescriptor) || [];
            handlers.push(callback);
            eventMap.set(eventDescriptor, handlers);
        });

        return () => {
            eventDescriptors.forEach((eventDescriptor) => {
                const handlers = eventMap.get(eventDescriptor).filter(item => item !== callback);

                eventMap.set(eventDescriptor, handlers);
            });
        };
    };

    const onEventByType = onEvent.bind(null, eventHandlersMap.types);
    const onEventById = onEvent.bind(null, eventHandlersMap.ids);

    const result = {
        async subscribeByEventType(eventTypes, handler) {
            await config.storage.loadEventsByTypes(eventTypes, handler);
            return onEventByType(eventTypes, handler);
        },

        async subscribeByAggregateId(aggregateId, handler) {
            const aggregateIds = Array.isArray(aggregateId) ? aggregateId : [aggregateId];
            await config.storage.loadEventsByAggregateId(aggregateIds, handler);
            return onEventById(aggregateIds, handler);
        },

        async getEventsByAggregateId(aggregateId, handler) {
            const aggregateIds = Array.isArray(aggregateId) ? aggregateId : [aggregateId];
            return await config.storage.loadEventsByAggregateId(aggregateIds, handler);
        },

        async onEvent(eventDescriptors, callback) {
            if (Array.isArray(eventDescriptors)) {
                return await onEventByType(eventDescriptors, callback);
            } else if (eventDescriptors.types || eventDescriptors.ids) {
                const typeUnsub =
                    Array.isArray(eventDescriptors.types) &&
                    onEventByType(eventDescriptors.types, callback);
                const idUnsub =
                    Array.isArray(eventDescriptors.ids) &&
                    onEventById(eventDescriptors.ids, callback);
                return () => {
                    typeUnsub && typeUnsub();
                    idUnsub && idUnsub();
                };
            } else {
                throw new Error('Wrong parameter for event subscription');
            }
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
