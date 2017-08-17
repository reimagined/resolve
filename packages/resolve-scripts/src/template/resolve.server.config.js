import fileDriver from 'resolve-storage-file';
import busDriver from 'resolve-bus-memory';
import events from './common/aggregates/todo-events';
import aggregates from './common/aggregates';
import queries from './common/read-models';

import clientConfig from './resolve.client.config.js';

const dbPath = process.env.NODE_ENV === 'production'
  ? './prod_db.json'
  : process.env.NODE_ENV === 'tests' ? './__test_db__.json' : './dev_db.json';

export default {
  entries: clientConfig,
  bus: { driver: busDriver },
  storage: {
    driver: fileDriver,
    params: { pathToFile: dbPath }
  },
  initialState: query => query('todos').then(todos => ({ todos })),
  aggregates,
  events,
  queries,
  extendExpress: () => {}
};
