import messages from './messages';

const hget = async ({ nativeAdapter, connectionPromise }, key, field) => {
    await connectionPromise;
    return await nativeAdapter.hget(key, field);
};

const hset = async ({ nativeAdapter, connectionPromise }, key, field, value) => {
    await connectionPromise;
    return await nativeAdapter.hset(key, field, value);
};

const del = async ({ nativeAdapter, connectionPromise }, key) => {
    await connectionPromise;
    return await nativeAdapter.del(key);
};

const getStoreInterface = (repository, isWriteable) => {
    if (isWriteable) {
        return Object.freeze({
            hget: hget.bind(null, repository),
            hset: hset.bind(null, repository),
            del: del.bind(null, repository)
        });
    }

    return Object.freeze({
        hget: hget.bind(null, repository),
        hset: async () => {
            throw new Error(messages.readSideForbiddenOperation('hset'));
        },
        del: async () => {
            throw new Error(messages.readSideForbiddenOperation('del'));
        }
    });
};

export default getStoreInterface;
