const serializeData = data => JSON.stringify(data);

const unserializeData = data => JSON.parse(data);

const safeParse = (str) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
};

const invokeCommand = (client, command, name, ...args) =>
    new Promise((resolve, reject) => {
        const params = [
            name,
            ...args,
            (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(Array.isArray(data) ? data.map(safeParse) : safeParse(data));
            }
        ];
        client[command](...params);
    });

export const hdel = async (client, collectionName, ...fields) =>
    await invokeCommand(client, 'HDEL', collectionName, ...fields);

export const hexists = async (client, collectionName, field) =>
    await invokeCommand(client, 'HEXISTS', collectionName, field);

export const hget = async (client, collectionName, field) =>
    await invokeCommand(client, 'HGET', collectionName, field);

export const hkeys = async (client, collectionName) =>
    await invokeCommand(client, 'HKEYS', collectionName);

export const hlen = async (client, collectionName) =>
    await invokeCommand(client, 'HLEN', collectionName);

export const hset = async (client, collectionName, field, values) =>
    await invokeCommand(client, 'HSET', collectionName, field, serializeData(values));

export const hvals = async (client, collectionName) =>
    await invokeCommand(client, 'HVALS', collectionName);

export const hincrby = async (client, key, field, increment) =>
    await invokeCommand(client, 'HINCRBY', key, field, increment);

export const del = async (client, ...keys) => {
    await invokeCommand(client, 'DEL', ...keys);
};

export const exists = async (client, key) => await invokeCommand(client, 'EXISTS', key);

export const type = async (client, key) => await invokeCommand(client, 'TYPE', key);

export const zadd = async (client, key, score, member) =>
    await invokeCommand(client, 'ZADD', key, score, member);

export const zaddMulti = async (client, args) => await invokeCommand(client, 'ZADD', args);

export const zrangebyscore = async (client, key, min, max, offset, count) => {
    // await invokeCommand(client, 'ZRANGEBYSCORE', key, min, max, ...args);
    if (offset === undefined && count === undefined) {
        return await invokeCommand(client, 'ZRANGEBYSCORE', key, min, max);
    } else if (count === undefined) {
        return await invokeCommand(client, 'ZRANGEBYSCORE', key, min, max, offset);
    } else {
        return await invokeCommand(client, 'ZRANGEBYSCORE', key, min, max, offset, count);
    }
};

export const zrangebylex = async (client, key, min, max, offset, count) => {
    // await invokeCommand(client, 'ZRANGEBYLEX', key, min, max, ...args);
    if (offset === undefined && count === undefined) {
        return await invokeCommand(client, 'ZRANGEBYLEX', key, min, max);
    } else if (count === undefined) {
        return await invokeCommand(client, 'ZRANGEBYLEX', key, min, max, offset);
    } else {
        return await invokeCommand(client, 'ZRANGEBYLEX', key, min, max, offset, count);
    }
};

export const zrem = async (client, key, member) => await invokeCommand(client, 'ZREM', key, member);

export const zinterstore = async (client, destination, keycount, keys) =>
    await invokeCommand(client, 'ZINTERSTORE', destination, keycount, ...keys);

export const zrange = async (client, key, start = 0, stop = -1) =>
    await invokeCommand(client, 'ZRANGE', key, start, stop);

export const expire = async (client, key, seconds) =>
    await invokeCommand(client, 'EXPIRE', key, seconds);
