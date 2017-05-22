import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import createBus from 'resolve-bus';
import driverRabbitmq from 'resolve-bus-rabbitmq';
import driverZmq from 'resolve-bus-zmq';

import config from './config';

// eslint-disable-next-line no-console
const log = console.log;
const POINTS = config.BENCHMARK_SERIES;

const busRabbitmq = createBus({ driver: driverRabbitmq({
    url: config.RABBITMQ_CONNECTION_URL
}) });

const busZmq = createBus({ driver: driverZmq({
    address: config.ZMQ_HOST,
    pubPort: config.ZMQ_PUB_PORT,
    subPort: config.ZMQ_SUB_PORT
}) });

function runLoadTests(count) {
    const childRabbimq = spawn('babel-node', [path.join(__dirname, './readEventsRabbit'), count]);
    const childZmq = spawn('babel-node', [path.join(__dirname, './readEventsZmq'), count]);

    let resolver;
    const done = new Promise((resolve, reject) => (resolver = resolve));
    const consoleInfo = {
        rabbitmq: '',
        zmq: ''
    };

    const logHandler = (store, rawData) => {
        const data = rawData.toString('utf8');
        consoleInfo[store] += data;
    };

    childRabbimq.stdout.on('data', logHandler.bind(null, 'rabbitmq'));
    childRabbimq.stderr.on('data', logHandler.bind(null, 'rabbitmq'));

    childZmq.stdout.on('data', logHandler.bind(null, 'zmq'));
    childZmq.stderr.on('data', logHandler.bind(null, 'zmq'));

    const initialTime = +new Date();
    let doneCount = 2;

    const resultInfo = {
        rabbitmq: {},
        zmq: {}
    };

    const doneHandler = (source) => {
        const workTime = +new Date() - initialTime;
        const passedInfo = JSON.parse(consoleInfo[source]);
        resultInfo[source] = {
            ...passedInfo,
            time: workTime
        };

        if (--doneCount === 0) {
            resolver(resultInfo);
        }
    };

    childRabbimq.on('exit', doneHandler.bind(null, 'rabbitmq'));
    childZmq.on('exit', doneHandler.bind(null, 'zmq'));

    let leftEvents = count;
    const produceEventsAsync = () => {
        if (--leftEvents === 0) return Promise.resolve();

        busRabbitmq.emitEvent({
            type: 'EVENT_TYPE',
            payload: {}
        });

        busZmq.emitEvent({
            type: 'EVENT_TYPE',
            payload: {}
        });

        return Promise.resolve()
            .then(produceEventsAsync);
    }

    produceEventsAsync(count);

    return done;
}

function fsWriteFileAsync(filename, content) {
    return new Promise((resolve, reject) =>
        fs.writeFile(filename, content, (err, value) => (
            !err ? resolve(value) : reject(err)
        ))
    );
}

function generateEvents(arr, i, storage) {
    return runLoadTests(arr[i]).then((data) => {
        storage[arr[i]] = data;
        if (i === arr.length - 1) {
            return storage;
        }
        return generateEvents(arr, i + 1, storage);
    });
}

generateEvents(POINTS, 0, {})
    .then(result => fsWriteFileAsync('./result.json', JSON.stringify(result)))
    .then(() => process.exit(0))
    .catch((err) => {
        log(err);
        process.exit(1);
    });
