import { MongoClient } from 'mongodb';

const LIMIT = 1000;

function loadEvents(coll, query, skip, limit, callback) {
    return coll
        .find(query)
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(limit)
        .toArray()
        .then(events =>
            events
                .reduce((total, event) => total.then(() => callback(event)), Promise.resolve())
                .then(
                    () =>
                        events.length === limit &&
                        loadEvents(coll, query, skip + limit, limit, callback)
                )
        );
}

export default function ({ url, collection }) {
    let promise;

    const indexes = {
        aggregateId: 1,
        type: 1,
        timestamp: 1
    };

    function getCollection() {
        if (!promise) {
            promise = MongoClient.connect(url)
                .then(db => db.collection(collection))
                .then(coll => coll.createIndex(indexes).then(() => coll));
        }

        return promise;
    }

    return {
        saveEvent: event => getCollection().then(coll => coll.insert(event)),
        loadEventsByTypes: (types, callback) =>
            getCollection().then(coll =>
                loadEvents(coll, { type: { $in: types } }, 0, LIMIT, callback)
            ),
        loadEventsByAggregateId: (aggregateId, callback) =>
            getCollection().then(coll => loadEvents(coll, { aggregateId }, 0, LIMIT, callback))
    };
}
