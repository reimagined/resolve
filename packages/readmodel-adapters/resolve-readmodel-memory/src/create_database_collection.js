import uuid from 'uuid/v4';
import Worker from 'tiny-worker';

export const TIMEOUT = 10000;

export default function createWorker() {
    const worker = new Worker(function () {
        const NeDB = require('nedb');
        const collection = new NeDB({ autoload: true, inMemoryOnly: true });

        this.onmessage = function ({ data }) {
            const { method, id, query, options, fieldName, document, update } = JSON.parse(data);

            switch (method) {
                case 'insert': {
                    collection.insert(document, function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                case 'update': {
                    collection.update(query, update, options, function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                case 'remove': {
                    collection.remove(query, options, function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                case 'ensureIndex': {
                    collection.ensureIndex(options, function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                case 'removeIndex': {
                    collection.removeIndex(fieldName, function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                case 'count': {
                    collection.count(query, function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                case 'findOne': {
                    collection.findOne(query, function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                case 'find': {
                    let cursor = collection.find(options.query, options.projection);

                    if (options.sort) {
                        cursor = cursor.sort(options.sort);
                    }
                    if (options.skip) {
                        cursor = cursor.skip(options.skip);
                    }
                    if (options.limit) {
                        cursor = cursor.limit(options.limit);
                    }
                    cursor.exec(function (err, result) {
                        postMessage(JSON.stringify({ id, err, result, method }));
                    });
                    break;
                }
                default:
            }
        };
    });

    const map = new Map();

    worker.onmessage = ({ data }) => {
        const { id, err, result } = JSON.parse(data);
        if (id && map.has(id)) {
            const callback = map.get(id);
            map.delete(id);
            callback(err, result);
        }
    };

    const find = (query) => {
        const options = { query };

        const cursor = {
            skip: (skip) => {
                options.skip = skip;
                return cursor;
            },
            limit: (limit) => {
                options.limit = limit;
                return cursor;
            },
            sort: (sort) => {
                options.sort = sort;
                return cursor;
            },
            exec: (callback) => {
                const id = uuid();

                map.set(id, callback);

                worker.postMessage(
                    JSON.stringify({
                        method: 'find',
                        options,
                        id
                    })
                );

                setTimeout(() => {
                    if (map.has(id)) {
                        map.get(id)('Timeout Error');
                        map.delete(id);
                    }
                }, TIMEOUT);
            }
        };

        return cursor;
    };

    const findOne = (query) => {
        const cursor = {
            exec: (callback) => {
                const id = uuid();

                map.set(id, callback);

                worker.postMessage(
                    JSON.stringify({
                        method: 'findOne',
                        query,
                        id
                    })
                );

                setTimeout(() => {
                    if (map.has(id)) {
                        map.get(id)('Timeout Error');
                        map.delete(id);
                    }
                }, TIMEOUT);
            }
        };

        return cursor;
    };

    const count = (query, callback) => {
        const id = uuid();

        map.set(id, callback);

        worker.postMessage(
            JSON.stringify({
                method: 'count',
                query,
                id
            })
        );

        setTimeout(() => {
            if (map.has(id)) {
                map.get(id)('Timeout Error');
                map.delete(id);
            }
        }, TIMEOUT);
    };

    const ensureIndex = (options, callback) => {
        const id = uuid();

        map.set(id, callback);

        worker.postMessage(
            JSON.stringify({
                method: 'ensureIndex',
                options,
                id
            })
        );

        setTimeout(() => {
            if (map.has(id)) {
                map.get(id)('Timeout Error');
                map.delete(id);
            }
        }, TIMEOUT);
    };

    const removeIndex = (fieldName, callback) => {
        const id = uuid();

        map.set(id, callback);

        worker.postMessage(
            JSON.stringify({
                method: 'removeIndex',
                fieldName,
                id
            })
        );

        setTimeout(() => {
            if (map.has(id)) {
                map.get(id)('Timeout Error');
                map.delete(id);
            }
        }, TIMEOUT);
    };

    const insert = (document, callback) => {
        const id = uuid();

        map.set(id, callback);

        worker.postMessage(
            JSON.stringify({
                method: 'insert',
                document,
                id
            })
        );

        setTimeout(() => {
            if (map.has(id)) {
                map.get(id)('Timeout Error');
                map.delete(id);
            }
        }, TIMEOUT);
    };

    const update = (query, update, options, callback) => {
        if (typeof options === 'function') {
            callback = options; // eslint-disable-line no-param-reassign
            options = {}; // eslint-disable-line no-param-reassign
        }

        const id = uuid();

        map.set(id, callback);

        worker.postMessage(
            JSON.stringify({
                method: 'update',
                query,
                update,
                options,
                id
            })
        );

        setTimeout(() => {
            if (map.has(id)) {
                map.get(id)('Timeout Error');
                map.delete(id);
            }
        }, TIMEOUT);
    };

    const remove = (query, options, callback) => {
        if (typeof options === 'function') {
            callback = options; // eslint-disable-line no-param-reassign
            options = {}; // eslint-disable-line no-param-reassign
        }

        const id = uuid();
        map.set(id, callback);

        worker.postMessage(
            JSON.stringify({
                method: 'remove',
                query,
                options,
                id
            })
        );

        setTimeout(() => {
            if (map.has(id)) {
                map.get(id)('Timeout Error');
                map.delete(id);
            }
        }, TIMEOUT);
    };

    return {
        find,
        findOne,
        count,
        ensureIndex,
        removeIndex,
        insert,
        update,
        remove
    };
}
