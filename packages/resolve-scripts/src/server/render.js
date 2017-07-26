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

    const bundleSource = process.env.NODE_ENV === 'production'
        ? `${rootDirectory}/static/bundle.js`
        : 'http://localhost:3001/bundle.js';

    res.send(
        '<!doctype html>\n' +
            `<html ${helmet.htmlAttributes.toString()}>\n` +
            '<head>\n' +
            `${helmet.title.toString()}` +
            `${helmet.meta.toString()}` +
            `${helmet.link.toString()}` +
            '<script>\n' +
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
