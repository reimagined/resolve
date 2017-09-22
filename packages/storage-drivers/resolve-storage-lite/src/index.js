import storage from './storage';

export default ({ pathToFile }) => {
    const prepareStorage = storage.prepare(pathToFile);

    return {
        saveEvent: event => prepareStorage.then(storage.saveEvent(event)),
        loadEventsByTypes: (types, callback) =>
            prepareStorage.then(storage.loadEvents({ type: { $in: types } }, callback)),
        loadEventsByAggregateIds: (ids, callback) =>
            prepareStorage.then(storage.loadEvents({ aggregateId: { $in: ids } }, callback))
    };
};
