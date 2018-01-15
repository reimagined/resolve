import { expect } from 'chai';
import redis from 'redis-mock';

import createRedisAdapter from '../src/index';
import nativeRedisAdapter from '../src/adapter';
import metaCollection from '../src/metaCollection';

const DEFAULT_COLLECTION_NAME = 'Test';

const Z_VALUE_SEPARATOR = `${String.fromCharCode(0x0)}${String.fromCharCode(0x0)}`;

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

describe('Read model redis adapter', () => {
    let adapter, getReadable, writable;

    let repository = {
        metaCollectionName: 'meta',
        autoincMetaCollectionName: 'meta_autoinc',
        client: redis.createClient(),
        lastTimestamp: 0
    };
    repository.metaCollection = metaCollection(repository);
    repository.nativeAdapter = nativeRedisAdapter(repository);

    repository.client['ZINTERSTORE'] = async function (destination, numkeys, ...args) {
        const cb = args[args.length - 1];

        const rangePromises = Object.values(args)
            .slice(0, numkeys)
            .map(
                async collectionName =>
                    await invokeCommand(repository.client, 'ZRANGE', collectionName, 0, -1)
            );

        const values = await Promise.all(rangePromises);
        let result = values[0];

        for (let i = 1; i < values.length; i++) {
            result = result.filter(n => values[i].includes(n));
        }

        const addPromises = result.map(
            async (id, index) =>
                await invokeCommand(repository.client, 'ZADD', destination, index, id)
        );

        await Promise.all(addPromises);
        cb(null, result);
    };

    const del = repository.client.del;
    repository.client['DEL'] = function () {
        const args = Object.values(arguments);
        const cbIndex = args.length - 1;
        const cb = args[cbIndex];
        const keys = args.slice(0, cbIndex);
        del(keys, cb);
    };

    repository.client['ZRANGEBYLEX'] = async function (collectionName, min, max, cb) {
        const searchValue = min.replace('[', '').split(Z_VALUE_SEPARATOR)[0];
        const rows = await invokeCommand(repository.client, 'ZRANGE', collectionName, 0, -1);

        const ids = rows
            .map((row) => {
                const values = row.split(Z_VALUE_SEPARATOR);
                return values[0] === searchValue ? row : null;
            })
            .filter(val => val !== null);

        cb(null, ids);
    };

    repository.client['ZREMRANGEBYLEX'] = async function (collectionName, min, max, cb) {
        const ids = await invokeCommand(repository.client, 'ZRANGEBYLEX', collectionName, min, max);
        await invokeCommand(repository.client, 'ZREM', collectionName, ...ids);
        cb(null, '');
    };

    const hdel = repository.client.hdel;
    repository.client['HDEL'] = function () {
        const args = Object.values(arguments);
        const cbIndex = args.length - 1;
        const cb = args[cbIndex];
        const collectionName = args[0];
        const ids = args.slice(1, cbIndex);
        hdel(collectionName, ids, cb);
    };

    beforeEach(async () => {
        await repository.nativeAdapter.createCollection(DEFAULT_COLLECTION_NAME);

        adapter = createRedisAdapter(
            {},
            repository.metaCollectionName,
            repository.autoincMetaCollectionName,
            repository.client
        );

        adapter.buildProjection({
            Init: async (store) => {
                writable = store;
                try {
                    const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);
                    await TestCollection.ensureIndex({ fieldName: 'i', fieldType: 'number' });
                    await TestCollection.ensureIndex({ fieldName: 's', fieldType: 'string' });

                    await TestCollection.insert({ i: 100, s: 'aaa', text: 'Initial', a: [] });
                    await TestCollection.insert({ i: 200, s: 'bbb', text: 'First text', a: [] });
                    await TestCollection.insert({ i: 100, s: 'bbb', text: 'Second text', a: [] });
                    await TestCollection.insert({ i: 100, s: 'bbb', text: 'Last text', a: [] });
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.log(`error: ${error}`);
                }
            },
            TestEvent: async (store, event) => {
                if (event.crashFlag) {
                    throw new Error('Test crashing event');
                }
                const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

                await TestCollection.insert({
                    text: event.text
                });
            }
        });

        const readSide = adapter.init();
        getReadable = readSide.getReadable;

        await getReadable();
    });

    afterEach(() => {
        repository.client.flushall((e) => {
            if (e) {
                // eslint-disable-next-line no-console
                console.log(e);
            }
        });
    });

    it('should have apropriate API', () => {
        expect(adapter.buildProjection).to.be.a('function');
        expect(adapter.init).to.be.a('function');
        expect(adapter.reset).to.be.a('function');
    });

    it('should provide actual collections list in storage', async () => {
        const readable = await getReadable();
        const collectionsList = await readable.listCollections();

        expect(collectionsList).to.be.deep.equal([DEFAULT_COLLECTION_NAME]);
    });

    it('sort asc', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const records = await TestCollection.find({}).sort({ _id: 1 });

        expect(records.length).to.be.equal(4);
        expect(records[0]._id).to.be.equal(1);
        expect(records[3]._id).to.be.equal(4);
    });

    it('sort desc', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const records = await TestCollection.find({}).sort({ _id: -1 });

        expect(records.length).to.be.equal(4);
        expect(records[0]._id).to.be.equal(4);
        expect(records[3]._id).to.be.equal(1);
    });

    it('find', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const records = await TestCollection.find();

        expect(records.length).to.be.equal(4);
    });

    it('find with empty criteria', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const records = await TestCollection.find({});

        expect(records.length).to.be.equal(4);
    });

    it('find witn criteria', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const records = await TestCollection.find({ i: 100, s: 'bbb' });

        expect(records.length).to.be.equal(2);
    });

    it('find by id', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const records = await TestCollection.find({ _id: 1 });

        expect(records[0].text).to.be.equal('Initial');
        expect(records[0]._id).to.be.equal(1);
    });

    it('find one', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const record = await TestCollection.findOne({ s: 'bbb' });

        expect(record.text).to.be.equal('First text');
        expect(record._id).to.be.equal(2);
    });

    it('find with skip and limit', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const records = await TestCollection.find({ s: 'bbb' })
            .skip(1)
            .limit(1);

        expect(records.length).to.be.equal(1);
        expect(records[0].text).to.be.equal('Second text');
        expect(records[0]._id).to.be.equal(3);
    });

    it('get count', async () => {
        const store = await getReadable();
        const TestCollection = await store.collection(DEFAULT_COLLECTION_NAME);

        const count = await TestCollection.count();

        expect(count).to.be.equal(4);
    });

    it('remove', async () => {
        const TestCollection = await writable.collection(DEFAULT_COLLECTION_NAME);

        await TestCollection.remove({ i: 100, s: 'bbb' });
        const records = await TestCollection.find();

        expect(records.length).to.be.equal(2);
        expect(records[0]._id).to.be.equal(1);
        expect(records[1]._id).to.be.equal(2);
    });

    it('update $unset', async () => {
        const TestCollection = await writable.collection('Test');

        const originDoc = await TestCollection.findOne({ _id: 1 });
        delete originDoc['text'];
        await TestCollection.update({ _id: 1 }, { $unset: { text: '' } });
        const updatedDoc = await TestCollection.findOne({ _id: 1 });

        expect(updatedDoc).to.be.deep.equal(originDoc);
    });

    it('update $inc', async () => {
        const TestCollection = await writable.collection('Test');
        const incVal = 50;

        const originDoc = await TestCollection.findOne({ _id: 1 });
        originDoc.i += incVal;

        await TestCollection.update({ _id: 1 }, { $inc: { i: incVal } });
        const updatedDoc = await TestCollection.findOne({ _id: 1 });

        expect(updatedDoc).to.be.deep.equal(originDoc);
    });

    it('update $push', async () => {
        const TestCollection = await writable.collection('Test');

        const originDoc = await TestCollection.findOne({ _id: 1 });
        originDoc.a.push(1000);

        await TestCollection.update({ _id: 1 }, { $push: { a: 1000 } });
        const updatedDoc = await TestCollection.findOne({ _id: 1 });

        expect(updatedDoc).to.be.deep.equal(originDoc);
    });

    it('update $push with new field', async () => {
        const TestCollection = await writable.collection('Test');

        const originDoc = await TestCollection.findOne({ _id: 1 });
        originDoc.b = [1000];

        await TestCollection.update({ _id: 1 }, { $push: { b: 1000 } });
        const updatedDoc = await TestCollection.findOne({ _id: 1 });

        expect(updatedDoc).to.be.deep.equal(originDoc);
    });
});
