import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import createBus from 'resolve-bus';

import config from '../configs/server.config.js';

const storage = createStorage({
    driver: config.storage.driver(config.storage.params)
});

const busDriver = config.bus.driver;
const bus = createBus({ driver: busDriver(config.bus.params) });

const eventStore = createEventStore({ storage, bus });

const subscribe = eventStore.onEvent;

export { subscribe };

export default eventStore;
