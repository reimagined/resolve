import React from 'react';
import ReactDOM from 'react-dom/server';
import { createMemoryHistory } from 'history';
import { createStore, AppContainer } from 'resolve-redux';
import { Helmet } from 'react-helmet';

import getRoutes from './get-routes';
import Routes from '../client/components/Routes';
import { Router } from 'react-router';

const ssrHandler = async (
  { seedClientEnvs, constants: { rootPath, staticPath }, utils, serverImports },
  req,
  res
) => {
  try {
    const { getRootBasedUrl, getStaticBasedPath, jsonUtfStringify } = utils;
    const baseQueryUrl = getRootBasedUrl(rootPath, '/');
    const url = req.path.substring(baseQueryUrl.length);
    const history = createMemoryHistory();
    history.push(url);
    const origin = '';

    const routes = getRoutes(serverImports);

    const store = createStore({ history, origin, rootPath, isClient: false });

    const staticContext = {};
    const markup = ReactDOM.renderToStaticMarkup(
      <AppContainer
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        store={store}
      >
        <Router history={history} staticContext={staticContext}>
          <Routes routes={routes} />
        </Router>
      </AppContainer>
    );

    const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'index.js');
    const faviconUrl = getStaticBasedPath(rootPath, staticPath, 'favicon.ico');
    const helmet = Helmet.renderStatic();

    const markupHtml =
      `<!doctype html>` +
      `<html ${helmet.htmlAttributes.toString()}>` +
      '<head>' +
      `<link rel="icon" type="image/x-icon" href="${faviconUrl}" />` +
      `${helmet.title.toString()}` +
      `${helmet.meta.toString()}` +
      `${helmet.link.toString()}` +
      `${helmet.style.toString()}` +
      '<script>' +
      `window.__RESOLVE_RUNTIME_ENV__=${jsonUtfStringify(seedClientEnvs)};` +
      '</script>' +
      `${helmet.script.toString()}` +
      '</head>' +
      `<body ${helmet.bodyAttributes.toString()}>` +
      `<div id="app-container">${markup}</div>` +
      `<script src="${bundleUrl}"></script>` +
      '</body>' +
      '</html>';

    await res.setHeader('Content-Type', 'text/html');

    await res.end(markupHtml);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('SSR error', error);
    res.status(500);
    res.end('SSR error');
  }
};

export default ssrHandler;
