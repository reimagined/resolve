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
            events.reduce((total, event) => total.then(() => callback(event)), Promise.resolve())
                .then(() =>
                    events.length === limit &&
                        loadEvents(coll, query, skip + limit, limit, callback)
                )
        );
}

export default function ({ url, collection }) {
    const onEventSavedCallbacks = [];

    let promise;

    function getCollection() {
        if (promise) {
            return promise;
        }

        promise = MongoClient.connect(url).then(db => db.collection(collection));

        return promise;
    }

    return {
        saveEvent: event =>
            getCollection()
                .then(coll => coll.insert(event))
                .then(() =>
                    onEventSavedCallbacks.forEach(cb => cb(event))
                ),
        loadEventsByTypes: (types, callback) =>
            getCollection().then(coll =>
                loadEvents(coll, { type: { $in: types } }, 0, LIMIT, callback)
            ),
        loadEventsByAggregateId: (aggregateId, callback) =>
            getCollection().then(coll =>
                loadEvents(coll, { aggregateId }, 0, LIMIT, callback)
            ),
        onEventSaved: (callback) => {
            onEventSavedCallbacks.push(callback);
        }
    };
}
