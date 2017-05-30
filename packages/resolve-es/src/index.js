function createDriver({ driver }) {
    let onEventSavedCallbacks = [];

    return {
        saveEvent: event =>
            driver.saveEvent(event).then(() => onEventSavedCallbacks.forEach(cb => cb(event))),

        loadEventsByTypes: driver.loadEventsByTypes,

        loadEventsByAggregateId: driver.loadEventsByAggregateId,

        onEventSaved: (callback) => {
            onEventSavedCallbacks.push(callback);
            return () =>
                (onEventSavedCallbacks = onEventSavedCallbacks.filter(item => item !== callback));
        }
    };
}

export default createDriver;
