import React from 'react';
import { render } from 'react-dom';
import { createStore, getOrigin } from 'resolve-redux';
import { createBrowserHistory } from 'history';

import App from './containers/App';
import Layout from './components/Layout';
import UploaderContext from './context';

const entryPoint = ({ rootPath, staticPath, localS3Constants }) => {
  const origin = getOrigin(window.location);
  const history = createBrowserHistory({ basename: rootPath });

  const store = createStore({
    history,
    origin,
    rootPath,
    isClient: true,
  });

  render(
    <Layout staticPath={staticPath}>
      <UploaderContext.Provider value={localS3Constants}>
        <App store={store} />
      </UploaderContext.Provider>
    </Layout>,
    document.getElementById('app-container')
  );
};

export default entryPoint;
