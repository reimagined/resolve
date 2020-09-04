import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-router';
import { createBrowserHistory } from 'history';
import { AppContainer, createStore, getOrigin } from 'resolve-redux';

import Routes from './components/Routes';
import getRoutes from './get-routes';

const entryPoint = ({ rootPath, staticPath, clientImports }) => {
  const origin = getOrigin(window.location);
  const history = createBrowserHistory({ basename: rootPath });
  const store = createStore({ history, origin, rootPath, isClient: true });
  const routes = getRoutes(clientImports);

  render(
    <AppContainer
      origin={origin}
      rootPath={rootPath}
      staticPath={staticPath}
      store={store}
    >
      <Router history={history}>
        <Routes routes={routes} />
      </Router>
    </AppContainer>,
    document.getElementById('app-container')
  );
};

export default entryPoint;
