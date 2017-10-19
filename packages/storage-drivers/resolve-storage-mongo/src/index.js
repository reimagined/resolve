import { MongoClient } from 'mongodb';
import { ConcurrentError } from 'resolve-storage-base';

const DUPLICATE_KEY_ERROR = 11000;

function loadEvents(coll, query, callback) {
    let doneResolver = null;
    const donePromise = new Promise(resolve => (doneResolver = resolve));
    let workerPromise = Promise.resolve();

    const cursorStream = coll.find(query, { sort: 'timestamp' }).stream();

    cursorStream.on('data', item => (workerPromise = workerPromise.then(() => callback(item))));

    cursorStream.on('end', () => (workerPromise = workerPromise.then(doneResolver)));

    return donePromise;
}

function createDriver({ url, collection }) {
    let promise;

    function getCollection() {
        if (!promise) {
            promise = MongoClient.connect(url)
                .then(db => db.collection(collection))
                .then(coll =>
                    coll
                        .createIndex('timestamp')
                        .then(() => coll.createIndex('aggregateId'))
                        .then(() =>
                            coll.createIndex(
                                { aggregateId: 1, aggregateVersion: 1 },
                                { unique: true }
                            )
                        )
                        .then(() => coll)
                );
        }

        return promise;
    }

    return {
        saveEvent: event =>
            getCollection().then(coll => coll.insert(event)).catch((e) => {
                if (e.code === DUPLICATE_KEY_ERROR) {
                    throw new ConcurrentError();
                }
                throw e;
            }),
        loadEventsByTypes: (types, callback) =>
            getCollection().then(coll => loadEvents(coll, { type: { $in: types } }, callback)),
        loadEventsByAggregateIds: (aggregateIds, callback) =>
            getCollection().then(coll =>
                loadEvents(coll, { aggregateId: { $in: aggregateIds } }, callback)
            )
    };
}

export default createDriver;
