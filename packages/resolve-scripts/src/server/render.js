import React from 'react';
import { Helmet } from 'react-helmet';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';

import config from '../configs/server.config.js';

const configEntries = config.entries;
const rootDirectory = config.rootDirectory || '';

export default (initialState, { req, res }) => {
    const html = renderToString(
        <Provider store={configEntries.createStore(Object.assign(initialState, req.initialState))}>
            <configEntries.rootComponent url={req.url} />
        </Provider>
    );

    const helmet = Helmet.renderStatic();

    const bundleSource = `${rootDirectory}/static/bundle.js`;

    const filterEnvVariablesRegex = /(^RESOLVE_)|^NODE_ENV$/;

    const processEnv = Object.keys(process.env)
        .filter(key => filterEnvVariablesRegex.test(key))
        .reduce((result, key) => {
            result[key] = process.env[key];
            return result;
        }, {});

    res.send(
        '<!doctype html>\n' +
            `<html ${helmet.htmlAttributes.toString()}>\n` +
            '<head>\n' +
            `${helmet.title.toString()}` +
            `${helmet.meta.toString()}` +
            `${helmet.link.toString()}` +
            '<script>\n' +
            `window.__PROCESS_ENV__=${JSON.stringify(processEnv)}\n` +
            `window.__INITIAL_STATE__=${JSON.stringify(initialState)}\n` +
            `window.__ROOT_DIRECTORY__=${JSON.stringify(rootDirectory)}\n` +
            '</script>\n' +
            `${helmet.script.toString()}\n` +
            '</head>\n' +
            `<body ${helmet.bodyAttributes.toString()}>\n` +
            `<div id="root">${html}</div>\n` +
            `<script src="${bundleSource}"></script>\n` +
            '</body>\n' +
            '</html>\n'
    );
};
