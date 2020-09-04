import React from 'react';

const { Provider, Consumer } = React.createContext({
  api: null,
  origin: '',
  rootPath: '',
  staticPath: 'static',
});

export { Provider, Consumer };
