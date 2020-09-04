const viewModels = [];
const readModels = [];
const aggregates = [];

const rootPath = '';
const staticPath = '';
const customConstants = {
  backend: {
    protocol: 'http',
    hostname: '127.0.0.1',
    port: 3000,
  },
  remoteReduxDevTools: {
    hostname: '127.0.0.1',
    port: 19042,
  },
};
const port = '3000';
const applicationName = 'react-native-shopping-list';

export const subscriber = {
  async init() {},
  async close() {},
  isConnected() {
    return true;
  },
};

const jwtCookie = { name: 'jwt' };

const resolveRedux = {
  actions: {},
  actionTypes: {},
  connectViewModel: () => {},
  connectReadModel: () => {},
  Providers: {},
  createStore: () => {},
  sendAggregateAction: () => {},
  getOrigin: () => {},
};

const nativeChunk = {
  viewModels,
  readModels,
  aggregates,
  rootPath,
  staticPath,
  customConstants,
  port,
  applicationName,
  subscriber,
  jwtCookie,
  resolveRedux,
};

const getNativeChunk = () => nativeChunk;

export default getNativeChunk;
