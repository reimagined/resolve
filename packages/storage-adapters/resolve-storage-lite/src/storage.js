import NeDB from 'nedb';
import { ConcurrentError } from 'resolve-storage-base';

const storage = {
  createDatabase: (NeDB, filename) => new NeDB({ filename }),

  init: db =>
    new Promise((resolve, reject) =>
      db.loadDatabase(error => (error ? reject(error) : resolve()))
    ),

  createIndex: (db, fieldName, isUnique = false) =>
    new Promise((resolve, reject) =>
      db.ensureIndex(
        { fieldName, ...(isUnique ? { unique: true, sparse: true } : {}) },
        error => (error ? reject(error) : resolve())
      )
    ),

  prepare: async filename => {
    const db = storage.createDatabase(NeDB, filename);
    await storage.init(db);
    await storage.createIndex(db, 'aggregateIdAndVersion');
    await storage.createIndex(db, 'aggregateId');
    await storage.createIndex(db, 'type');
    return db;
  },

  loadEvents: (query, startTime, callback) => db =>
    new Promise((resolve, reject) =>
      db
        .find({ ...query, timestamp: { $gt: startTime } })
        .sort({ timestamp: 1 })
        .projection({ aggregateIdAndVersion: 0, _id: 0 })
        .exec((error, events) => {
          if (error) {
            reject(error);
          } else {
            events.forEach(callback);
            resolve();
          }
        })
    ),

  saveEvent: event => db =>
    new Promise((resolve, reject) =>
      db.insert(
        {
          ...event,
          aggregateIdAndVersion: `${event.aggregateId}:${
            event.aggregateVersion
          }`
        },
        error => {
          if (!error) {
            resolve();
          } else if (error.errorType === 'uniqueViolated') {
            reject(
              new ConcurrentError(
                // eslint-disable-next-line max-len
                `Can not save the event because aggregate '${
                  event.aggregateId
                }' is not actual at the moment. Please retry later.`
              )
            );
          } else {
            reject(error);
          }
        }
      )
    )
};

export default storage;
