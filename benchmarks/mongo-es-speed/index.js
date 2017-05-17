import { spawn } from 'child_process';
import rawFs from 'fs';
import { MongoClient } from 'mongodb';
import nyanProgress from 'nyan-progress';
import path from 'path';
import pify from 'pify';

import prepareEvents from './prepareEvents';
import config from './config';

const POINTS = config.BENCHMARK_SERIES;
const fs = pify(rawFs);

const totalMaxValue = POINTS.reduce((acc, val) => (acc + val), 0) * 2;
const progress = nyanProgress();
const totalEventProcessed = { value: 0 };
const totalEventReported = { value: 0 };

const progressDonePromise = progress.start({
    total: totalMaxValue,
    message: {
        downloading: ['Load testing progress'],
        finished: 'Load testing done',
        error: 'Load testing error'
    }
});

const INFO_TOKEN = '-------INFO-------';
const DONE_TOKEN = '-------DONE-------';
const ERR_TOKEN = '-------ERR-------';

// eslint-disable-next-line no-console
const log = console.log;

setTimeout(function reporterHandler() {
    if (totalEventReported.value !== totalEventProcessed.value) {
        const tickSize = totalEventProcessed.value - totalEventReported.value;
        progress.tick(tickSize);
        totalEventReported.value = totalEventProcessed.value;
    }

    setTimeout(reporterHandler, 500);
}, 500);

function runLoadTests() {
    const initialTime = new Date();
    const child = spawn('babel-node', [path.join(__dirname, './buildState')]);

    let resolver;
    let rejecter;

    const done = new Promise((resolve, reject) => {
        resolver = resolve;
        rejecter = reject;
    });

    const logHandler = (data) => {
        if (data.indexOf(DONE_TOKEN) >= 0) {
            const transferPayload = JSON.parse(data.substring(DONE_TOKEN.length));
            const buildTime = new Date() - initialTime;
            child.kill();

            resolver(Object.assign({ buildTime }, transferPayload));
        } else if (data.indexOf(ERR_TOKEN) >= 0) {
            child.kill();
            rejecter(data.substring(ERR_TOKEN.length));
        } else if (data.indexOf(INFO_TOKEN) >= 0) {
            const transferPayload = JSON.parse(data.substring(INFO_TOKEN.length));
            totalEventProcessed.value += transferPayload.appendProgress;
        }
    };

    child.stdout.on('data', data => logHandler(data.toString('utf8')));
    child.stderr.on('data', data => logHandler(data.toString('utf8')));

    return done;
}

function dropCollection() {
    return MongoClient.connect(config.MONGODB_CONNECTION_URL).then(db =>
        new Promise(resolve => db
            .collection(config.MONGODB_COLLECTION_NAME, { strict: true }, (err, collection) => (
                err ? resolve() : collection.drop().then(resolve)
        )))
        .catch(err => log('Error while drop collection:', err))
        .then(() => db.close())
    );
}

function generateEvents(arr, i, storage) {
    return dropCollection()
        .then(() => prepareEvents(arr[i], totalEventProcessed))
        .then(runLoadTests)
        .then((data) => {
            storage[arr[i]] = data;
            if (i === arr.length - 1) {
                return storage;
            }
            return generateEvents(arr, i + 1, storage);
        });
}

function getDataString(arr, callback) {
    return arr
        .reduce((result, item) => `${result}${callback(item)},`, '')
        .replace(/,$/, '\n');
}

function storeToCsv(filePath, points, data, dataGetter) {
    return fs.writeFile(filePath,
        getDataString(points, point => `Events count: ${point}`) +
        getDataString(points, point => dataGetter(data, point))
    );
}

function storeSummaryToXML(filePath, points, data) {
    let dataString = '<?xml version="1.0" ?>\n<tabs>';

    dataString += points.reduce((result, point) => `${result}<tab name="Events count: ${point}">`
        + `<field name="Build time" value="${data[point].buildTime} ms" />`
        + `<field name="Memory resident size" value="${Math.round(data[point].memory.rss / 1024 / 1024)} mb" />`
        + `<field name="Memory heap total" value="${Math.round(data[point].memory.heapTotal / 1024 / 1024)} mb" />`
        + `<field name="Memory heap used" value="${Math.round(data[point].memory.heapUsed / 1024 / 1024)} mb" />`
        + '</tab>'
    , '');

    dataString += '</tabs>';

    return fs.writeFile(filePath, dataString);
}

generateEvents(POINTS, 0, {})
    .then(result => progress.tick(totalMaxValue) && result)
    .then(result => Promise.all([
        storeToCsv('./build-time.csv', POINTS, result, (data, point) => `${data[point].buildTime}`),
        storeToCsv('./memory-rss.csv', POINTS, result, (data, point) =>
            `${Math.round(data[point].memory.rss / 1024 / 1024)}`
        ),
        storeToCsv('./memory-heap-total.csv', POINTS, result, (data, point) =>
            `${Math.round(data[point].memory.heapTotal / 1024 / 1024)}`
        ),
        storeToCsv('./memory-heap-used.csv', POINTS, result, (data, point) =>
            `${Math.round(data[point].memory.heapUsed / 1024 / 1024)}`
        ),
        storeSummaryToXML('./summary.xml', POINTS, result)
    ]))
    .then(() => progressDonePromise)
    .then(() => process.exit(0))
    .catch((err) => {
        log(err);
        process.exit(1);
    });
