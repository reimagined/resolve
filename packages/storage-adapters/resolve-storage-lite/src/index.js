import storage from './storage';

export default ({ pathToFile } = {}) => {
    const prepareStorage = storage.prepare(pathToFile);

    return {
        saveEvent: event => prepareStorage.then(storage.saveEvent(event)),
        loadEventsByTypes: (types, callback, startTime = 0) =>
            prepareStorage.then(storage.loadEvents({ type: { $in: types } }, startTime, callback)),
        loadEventsByAggregateIds: (ids, callback, startTime = 0) =>
            prepareStorage.then(storage.loadEvents({ aggregateId: { $in: ids } }, startTime, callback))
    };
};
