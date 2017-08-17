import createEventStore from 'resolve-es';

import config from '../configs/server.config.js';

const storage = config.storage.driver(config.storage.params);

const busDriver = config.bus.driver;
const bus = busDriver(config.bus.params);

const eventStore = createEventStore({ storage, bus });

const subscribe = bus.onEvent;

export { subscribe };

export default eventStore;
