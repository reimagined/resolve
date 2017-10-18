import 'regenerator-runtime/runtime';
import NeDB from 'nedb';
import AsyncLock from 'async-lock';
import { ConcurrentError } from 'resolve-storage-base';
const lock = new AsyncLock();

const storage = {
    init: db =>
        new Promise((resolve, reject) =>
            db.loadDatabase(error => (error ? reject(error) : resolve()))
        ),

    createIndex: (db, fieldName) =>
        new Promise((resolve, reject) =>
            db.ensureIndex({ fieldName }, error => (error ? reject(error) : resolve()))
        ),

    createDatabase: (NeDB, filename) => new NeDB({ filename }),

    prepare: async (filename) => {
        const db = storage.createDatabase(NeDB, filename);
        await storage.init(db);
        await storage.createIndex(db, 'type');
        await storage.createIndex(db, 'aggregateId');
        return db;
    },

    loadEvents: (query, callback) => db =>
        new Promise((resolve, reject) =>
            db.find(query).sort({ timestamp: 1 }).exec((error, events) => {
                if (error) {
                    reject(error);
                } else {
                    events.forEach(callback);
                    resolve();
                }
            })
        ),

    saveEvent: event => db =>
        lock.acquire(
            event.aggregateId,
            () =>
                new Promise((resolve, reject) => {
                    const { aggregateId, aggregateVersion } = event;

                    db.findOne({ aggregateId, aggregateVersion }, (err, doc) => {
                        if (doc !== null) {
                            throw new ConcurrentError();
                        }
                        db.insert(event, error => (error ? reject(error) : resolve()));
                    });
                })
        )
};

export default storage;
