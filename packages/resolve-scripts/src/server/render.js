import React from 'react';
import { Helmet } from 'react-helmet';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';

// eslint-disable-next-line import/no-extraneous-dependencies
const configEntries = require('RESOLVE_CONFIG').entries;

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
        res.write(`
      <!doctype html>
      <html ${helmet.htmlAttributes.toString()}>
        <head>
          ${helmet.title.toString()}
          ${helmet.meta.toString()}
          ${helmet.link.toString()}
          <script>
            window.__INITIAL_STATE__=${JSON.stringify(initialState)}
          </script>
        </head>
        <body ${helmet.bodyAttributes.toString()}>
          <div id="root">
            ${html}
          </div>
          <script src="${process.env.NODE_ENV === 'production'
              ? '/static/bundle.js'
              : 'http://localhost:3001/bundle.js'}"></script>
        </body>
      </html>
    `);

        res.end();
    }
};
