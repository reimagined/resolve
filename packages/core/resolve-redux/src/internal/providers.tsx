import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { Provider as ResolveProvider } from './resolve-context';

class Providers extends React.PureComponent<any> {
  render() {
    const {
      origin,
      rootPath,
      staticPath,
      store,
      children,
      //queryMethod
    } = this.props;

    const api = null; //createApi({ origin, rootPath, store, queryMethod })

    return (
      <ResolveProvider
        value={{
          api,
          origin,
          rootPath,
          staticPath,
        }}
      >
        <ReduxProvider store={store}>{children}</ReduxProvider>
      </ResolveProvider>
    );
  }
}

export default Providers;
