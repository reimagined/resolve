import { declareRuntimeEnv } from '@reimagined/scripts'

const testFunctionalConfig = {
  target: 'local',
  port: declareRuntimeEnv('PORT', '3000'),
  mode: 'development',
  rootPath: '',
  staticPath: 'static',
  staticDir: 'static',
  distDir: 'dist',
  eventstoreAdapter: {
    module: 'resolve-eventstore-lite',
    options: {
      databaseFile: 'data/event-store-test-functional.db',
    },
  },
  jwtCookie: {
    name: 'jwt',
    maxAge: 31536000000,
  },
  eventBroker: {
    databaseFile: 'data/local-bus-broker-test-functional.db',
  },
}

export default testFunctionalConfig
