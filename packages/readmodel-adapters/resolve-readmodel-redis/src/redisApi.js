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

export const hdel = async (client, collectionName, field) =>
    await invokeCommand(client, 'HDEL', collectionName, field);

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

export const del = async (client, key) => await invokeCommand(client, 'DEL', key);

export const exists = async (client, key) => await invokeCommand(client, 'EXISTS', key);

export const type = async (client, key) => await invokeCommand(client, 'TYPE', key);

export const zadd = async (client, key, score, member) =>
    await invokeCommand(client, 'ZADD', key, score, member);

export const zrangebyscore = async (client, key, min, max, offset = null, count = null) =>
    await invokeCommand(client, 'ZRANGEBYSCORE', min, max, offset, count);
