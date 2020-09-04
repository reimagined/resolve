import React from 'react';
import { render } from 'react-dom';
import { createStore, getOrigin } from 'resolve-redux';
import { createBrowserHistory } from 'history';
import jsCookie from 'js-cookie';
import jwt from 'jsonwebtoken';

import App from './containers/App';
import Layout from './components/Layout';

const entryPoint = ({ rootPath, staticPath, localS3Constants }) => {
  const { CDNUrl } = localS3Constants;
  const origin = getOrigin(window.location);
  const history = createBrowserHistory({ basename: rootPath });
  const token = jsCookie.get('jwt');
  const jwtObject =
    token != null && token.constructor === String ? jwt.decode(token) : null;

  const store = createStore({
    initialState: { jwt: jwtObject },
    history,
    origin,
    rootPath,
    isClient: true,
  });

  const appContainer = document.createElement('div');
  document.body.appendChild(appContainer);
  render(
    <Layout staticPath={staticPath} jwt={jwtObject}>
      <App store={store} CDNUrl={CDNUrl} />
    </Layout>,
    appContainer
  );
};

export default entryPoint;
