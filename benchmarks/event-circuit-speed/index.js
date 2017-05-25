import { spawn } from 'child_process';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import nyanProgress from 'nyan-progress';
import path from 'path';

import { INFO_TOKEN, DONE_TOKEN, ERR_TOKEN } from './constants';
import prepareEvents from './prepareEvents';
import config from './config';

// eslint-disable-next-line no-console
const log = console.log;
const POINTS = config.BENCHMARK_SERIES;
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

function reporterHandler() {
    if (totalEventReported.value !== totalEventProcessed.value) {
        const tickSize = totalEventProcessed.value - totalEventReported.value;
        progress.tick(tickSize);
        totalEventReported.value = totalEventProcessed.value;
    }

    setTimeout(reporterHandler, 500);
}

setTimeout(reporterHandler, 500);

function runLoadTests() {
    const initialTime = new Date();
    const child = spawn('babel-node', [path.join(__dirname, './buildState')]);

    let resolver;
    let rejecter;

    const done = new Promise((resolve, reject) => {
        resolver = resolve;
        rejecter = reject;
    });

    const logHandler = (rawData) => {
        const data = rawData.toString('utf8');

        if (data.indexOf(DONE_TOKEN) >= 0) {
            const transferPayload = JSON.parse(data.substring(DONE_TOKEN.length));
            const buildTime = new Date() - initialTime;
            child.kill();

            resolver(Object.assign({ buildTime }, transferPayload));
        } else if (data.indexOf(ERR_TOKEN) >= 0) {
            child.kill();
            rejecter(data.substring(ERR_TOKEN.length));
        } else if (data.indexOf(INFO_TOKEN) >= 0) {
            const transferString = data.substring(INFO_TOKEN.length);
            const progressValue = parseInt(transferString, 10);
            totalEventProcessed.value += progressValue;
        }
    };

    child.stdout.on('data', logHandler);
    child.stderr.on('data', logHandler);

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

function fsWriteFileAsync(filename, content) {
    return new Promise((resolve, reject) =>
        fs.writeFile(filename, content, (err, value) => (
            !err ? resolve(value) : reject(err)
        ))
    );
}

function storeToCsv(filePath, points, data, dataGetter) {
    return fsWriteFileAsync(filePath,
        `${points.map(point => `Events count: ${point}`).join(',')}\n` +
        `${points.map(point => dataGetter(data[point])).join(',')}\n`
    );
}

function storeSummaryToXML(filePath, points, data) {
    return fsWriteFileAsync(filePath,
        `<?xml version="1.0" ?>\n<tabs>
        ${points.map((point) => {
            const rss = Math.round(data[point].memory.rss / 1024 / 1024);
            const heapTotal = Math.round(data[point].memory.heapTotal / 1024 / 1024);
            const heapUsed = Math.round(data[point].memory.heapUsed / 1024 / 1024);

            return `<tab name="Events count: ${point}">`
                + `<field name="Build time" value="${data[point].buildTime} ms" />`
                + `<field name="Memory resident size" value="${rss} mb" />`
                + `<field name="Memory heap total" value="${heapTotal} mb" />`
                + `<field name="Memory heap used" value="${heapUsed} mb" />`
                + '</tab>';
        }).join('')}
        </tabs>`
    );
}

generateEvents(POINTS, 0, {})
    .then(result => progress.tick(totalMaxValue) && result)
    .then(result => Promise.all([
        storeToCsv('./build-time.csv', POINTS, result, info => `${info.buildTime}`),
        storeToCsv('./entities-count.csv', POINTS, result, info => `${info.entities}`),
        storeToCsv('./memory-rss.csv', POINTS, result, info =>
            `${Math.round(info.memory.rss / 1024 / 1024)}`
        ),
        storeToCsv('./memory-heap-total.csv', POINTS, result, info =>
            `${Math.round(info.memory.heapTotal / 1024 / 1024)}`
        ),
        storeToCsv('./memory-heap-used.csv', POINTS, result, info =>
            `${Math.round(info.memory.heapUsed / 1024 / 1024)}`
        ),
        storeSummaryToXML('./summary.xml', POINTS, result)
    ]))
    .then(() => progressDonePromise)
    .then(() => process.exit(0))
    .catch((err) => {
        log(err);
        process.exit(1);
    });
