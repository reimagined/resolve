import benchmark from 'benchmark-base';
import path from 'path';
import config from './config';

benchmark({
    benchmarkSeries: config.BENCHMARK_SERIES,
    totalValue: config.BENCHMARK_SERIES.reduce((acc, val) => (acc + val), 0) * 2,
    preparerModule: path.join(__dirname, './preparer.js'),
    workerModule: path.join(__dirname, './worker.js'),
    reporterModule: path.join(__dirname, './reporter.js')
});
