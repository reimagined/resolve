import React from 'react';
import { Helmet } from 'react-helmet';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_CONFIG';

const configEntries = config.entries;
const rootDirectory = config.rootDirectory || '';

export default (initialState, { req, res }) => {
    const context = {};

    const html = renderToString(
        <Provider store={configEntries.createStore(initialState)}>
            <configEntries.rootComponent />
        </Provider>
    );

    const helmet = Helmet.renderStatic();

    if (context.url) {
        res.writeHead(301, {
            Location: context.url
        });
        res.end();
    } else {
        const bundleSource = process.env.NODE_ENV === 'production'
            ? `${rootDirectory}/static/bundle.js`
            : 'http://localhost:3001/bundle.js';

        res.write(
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
                '</head>\n' +
                `<body ${helmet.bodyAttributes.toString()}>\n` +
                `<div id="root">${html}</div>\n` +
                `<script src="${bundleSource}"></script>\n` +
                '</body>\n' +
            '</html>\n'
        );

        res.end();
    }
};
