import React from 'react';
import { Helmet } from 'react-helmet';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { RouterContext } from 'react-router';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_SERVER_CONFIG';

const configEntries = config.entries;
const rootDirectory = config.rootDirectory || '';

export default (initialState, renderProps, { req, res }) => {
    const context = {};

    const isProduction = process.env.NODE_ENV === 'production';

    const html = renderToString(
        <Provider store={configEntries.createStore(initialState)}>
            <RouterContext {...renderProps} />
        </Provider>
    );

    const helmet = Helmet.renderStatic();

    if (context.url) {
        res.writeHead(301, {
            Location: context.url
        });
        res.end();
    } else {
        const bundleSource = isProduction
            ? `${rootDirectory}/static/bundle.js`
            : 'http://localhost:3001/bundle.js';

        const bundleCssSource = isProduction
            ? '/static/bundle.css'
            : 'http://localhost:3001/bundle.css';

        res.send(
            '<!doctype html>\n' +
                `<html ${helmet.htmlAttributes.toString()}>\n` +
                '<head>\n' +
                `<link rel="stylesheet" type="text/css" href="${bundleCssSource}">` +
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
                `<div id="root"><div>${html}</div></div>\n` +
                `<script src="${bundleSource}"></script>\n` +
                '</body>\n' +
                '</html>\n'
        );
    }
};
