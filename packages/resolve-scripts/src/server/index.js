import http, { createServer } from 'http';
import socketIO from 'socket.io';
import app, { executeQuery } from './express';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import connectionHandler from './socket';
import prepareUrls from './utils/prepare_urls';
import openBrowser from './utils/open_browser';

import { makeExecutableSchema } from 'graphql-tools';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import config from '../configs/server.config.js';

// eslint-disable-next-line no-console
const log = console.log;

const server = http.createServer(app);
const rootDirectory = process.env.ROOT_DIR || '';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const appDirectory = fs.realpathSync(process.cwd());
const useYarn = fs.existsSync(path.resolve(appDirectory, 'yarn.lock'));

const io = socketIO(server, {
    path: `${rootDirectory || ''}/socket`
});

io.on('connection', connectionHandler);

const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const appName = JSON.parse(fs.readFileSync(path.resolve(appDirectory, 'package.json'))).name;
const urls = prepareUrls(protocol, HOST, PORT);

const ws = createServer();

const GRAPHQL_WS_PORT = PORT + 1;
ws.listen(GRAPHQL_WS_PORT, () => {
    log(`GraphQL Subscription Server is now running on http://localhost:${GRAPHQL_WS_PORT}`);
    new SubscriptionServer(executeQuery.getGraphql(), {
        server: ws,
        path: '/subscriptions'
    });
});

server.on('listening', () => {
    log();
    log(`You can now view ${chalk.bold(appName)} in the browser.`);
    log();

    if (urls.lanUrlForTerminal) {
        log(`  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}`);
        log(`  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`);
    } else {
        log(`  ${urls.localUrlForTerminal}`);
    }

    log();
    log('Note that the development build is not optimized.');
    log('To create a production build, use:');
    log(`  ${chalk.cyan(`${useYarn ? 'yarn build' : 'npm run build'}`)}.`);
    log(`  ${chalk.cyan(`${useYarn ? 'yarn start' : 'npm start'}`)}.`);
    log();

    openBrowser(urls.localUrlForBrowser);
});

server.listen(PORT);
