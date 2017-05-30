import { MongoClient } from 'mongodb';

function loadEvents(coll, query, callback) {
    let doneResolver = null;
    const donePromise = new Promise(resolve => (doneResolver = resolve));
    let workerPromise = Promise.resolve();

    const cursorStream = coll.find(query, { sort: 'timestamp' }).stream();

    cursorStream.on('data', item => (workerPromise = workerPromise.then(() => callback(item))));

    cursorStream.on('end', () => (workerPromise = workerPromise.then(doneResolver)));

    return donePromise;
}

export default function ({ url, collection }) {
    let promise;

    function getCollection() {
        if (!promise) {
            promise = MongoClient.connect(url)
                .then(db => db.collection(collection))
                .then(coll =>
                    coll
                        .createIndex('timestamp')
                        .then(() => coll.createIndex('aggregateId'))
                        .then(() => coll)
                );
        }

        return promise;
    }

    return {
        saveEvent: event => getCollection().then(coll => coll.insert(event)),
        loadEventsByTypes: (types, callback) =>
            getCollection().then(coll => loadEvents(coll, { type: { $in: types } }, callback)),
        loadEventsByAggregateId: (aggregateId, callback) =>
            getCollection().then(coll => loadEvents(coll, { aggregateId }, callback))
    };
}
