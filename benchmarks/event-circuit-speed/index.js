import benchmark from 'benchmark-base';
import path from 'path';
import config from './config';

benchmark(
    config.BENCHMARK_SERIES,
    path.join(__dirname, './preparer.js'),
    path.join(__dirname, './worker.js'),
    path.join(__dirname, './reporter.js')
);
