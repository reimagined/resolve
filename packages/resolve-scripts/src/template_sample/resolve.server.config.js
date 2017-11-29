import fileAdapter from 'resolve-storage-lite';
import busAdapter from 'resolve-bus-memory';
import eventTypes from './common/aggregates/todo-events';
import aggregates from './common/aggregates';
import readModels from './common/read-models';
import viewModels from './common/view-models';
import clientConfig from './resolve.client.config.js';

if (module.hot) {
    module.hot.accept();
}

const dbPath =
    process.env.NODE_ENV === 'production'
        ? './prod.db'
        : process.env.NODE_ENV === 'tests' ? './__test.db' : './dev.db';

export default {
    entries: clientConfig,
    bus: { adapter: busAdapter },
    storage: {
        adapter: fileAdapter,
        params: { pathToFile: dbPath }
    },
    initialState: async queryExecutors => await queryExecutors['default'](['root-id']),
    aggregates,
    initialSubscribedEvents: { types: Object.values(eventTypes), ids: ['root-id'] },
    readModels,
    viewModels
};
