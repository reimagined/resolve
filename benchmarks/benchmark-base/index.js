import { spawn } from 'child_process';
import fs from 'fs';
import nyanProgress from 'nyan-progress';
import path from 'path';

import { INFO_TOKEN, DONE_TOKEN, ERR_TOKEN } from './constants';

export default function generateBenchmark(options) {
    const { benchmarkSeries, preparerModule, workerModule, reporterModule, totalValue } = options;
    // eslint-disable-next-line no-console
    const log = console.log;

    const preparer = (...args) => (require(preparerModule).default)(...args);
    const reporter = (...args) => (require(reporterModule).default)(...args);

    const progress = nyanProgress();
    const totalProcessed = { value: 0 };
    const totalReported = { value: 0 };

    const progressDonePromise = progress.start({
        total: totalValue,
        message: {
            downloading: ['Load testing progress'],
            finished: 'Load testing done',
            error: 'Load testing error'
        }
    });

    const reporterHandler = () => {
        if (totalReported.value !== totalProcessed.value) {
            const tickSize = totalProcessed.value - totalReported.value;
            progress.tick(tickSize);
            totalReported.value = totalProcessed.value;
        }

        setTimeout(reporterHandler, 500);
    }

    setTimeout(reporterHandler, 500);

    const runLoadTests = series => new Promise((resolve, reject) => {
        const initialTime = new Date();
        const child = spawn('babel-node', [
            path.join(__dirname, './worker'),
            workerModule,
            series
        ]);

        const logHandler = (rawData) => {
            const data = rawData.toString('utf8');

            if (data.indexOf(DONE_TOKEN) >= 0) {
                const transferPayload = JSON.parse(data.substring(DONE_TOKEN.length));
                const buildTime = new Date() - initialTime;

                const resolveData = Object.assign({ buildTime }, transferPayload);
                resolve(resolveData);

                child.kill();
            } else if (data.indexOf(ERR_TOKEN) >= 0) {
                const rejectData = data.substring(ERR_TOKEN.length)
                reject(rejectData);

                child.kill();
            } else if (data.indexOf(INFO_TOKEN) >= 0) {
                const transferString = data.substring(INFO_TOKEN.length);
                const progressValue = parseInt(transferString, 10);
                totalProcessed.value += progressValue;
            }
        };

        child.stdout.on('data', logHandler);
        child.stderr.on('data', logHandler);
    });

    const generateSeries = (arr, i, storage) => (
        preparer(arr[i], totalProcessed)
            .then(runLoadTests)
            .then((data) => {
                storage[arr[i]] = data;
                if (i === arr.length - 1) {
                    return storage;
                }
                return generateSeries(arr, i + 1, storage);
            })
    );

    const fsWriteFileAsync = (filename, content) => {
        return new Promise((resolve, reject) =>
            fs.writeFile(filename, content, (err, value) => (
                !err ? resolve(value) : reject(err)
            ))
        );
    }

    generateSeries(benchmarkSeries, 0, {})
        .then(result => progress.tick(totalValue) && result)
        .then(result => reporter(result, fsWriteFileAsync))
        .then(() => progressDonePromise)
        .then(() => process.exit(0))
        .catch((err) => {
            log(err);
            process.exit(1);
        });
}
