import { del, hget, hset, hdel } from './redisApi';
import createMeta from './meta';

const hgetCommand = async ({ client, meta }, key, field) => await hget(client, key, field);

const hsetCommand = async ({ client, meta }, key, field, value) => {
    if (value === null || value === undefined) {
        await hdel(client, key, field);
        await meta.del(key);
    } else {
        await hset(client, key, field, value);
        if (!await meta.exists(key)) {
            await meta.create(key);
        }
    }
};

const delCommand = async ({ client, meta }, key) => {
    await del(client, key);
    await meta.del(key);
};

const adapter = async (repository) => {
    repository.meta = await createMeta(repository);

    return Object.freeze({
        hget: hgetCommand.bind(null, repository),
        hset: hsetCommand.bind(null, repository),
        del: delCommand.bind(null, repository)
    });
};

export default adapter;
