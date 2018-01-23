const serializeData = data => JSON.stringify(data);

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

export const del = async (client, ...keys) => await invokeCommand(client, 'DEL', ...keys);

export const hdel = async (client, key, ...fields) =>
    await invokeCommand(client, 'HDEL', key, ...fields);

export const hget = async (client, key, field) => await invokeCommand(client, 'HGET', key, field);

export const hkeys = async (client, key) => await invokeCommand(client, 'HKEYS', key);

export const hset = async (client, key, field, value) =>
    await invokeCommand(client, 'HSET', key, field, serializeData(value));
