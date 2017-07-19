import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import createBus from 'resolve-bus';

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_CONFIG';

const storage = createStorage({
    driver: config.storage.driver(config.storage.params)
});

const busDriver = config.bus.driver;
const bus = createBus({ driver: busDriver(config.bus.params) });

const eventStore = createEventStore({ storage, bus });

const subscribe = bus.onEvent;

export { subscribe };

export default eventStore;
