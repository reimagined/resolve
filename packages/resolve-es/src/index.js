export default ({ storage, bus, transforms = [] }) => ({
    async subscribeByEventType(eventTypes, handler) {
        await storage.loadEventsByTypes(eventTypes, handler);

        return bus.onEvent(eventTypes, handler);
    },

    getEventsByAggregateId(aggregateId, handler) {
        return storage.loadEventsByAggregateId(aggregateId, handler);
    },

    async saveEvent(event) {
        await storage.saveEvent(event);
        await bus.emitEvent(event);
        return event;
    }
});
