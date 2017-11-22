import createEventStore from 'resolve-es';

import config from '../configs/server.config.js';

const storage = config.storage.adapter(config.storage.params);

const busAdapter = config.bus.adapter;
const bus = busAdapter(config.bus.params);

const eventStore = createEventStore({ storage, bus });

const subscribe = async (eventDescriptors, callback) => {
    if (Array.isArray(eventDescriptors)) {
        return await eventStore.subscribeByEventType(eventDescriptors, callback, true);
    } else if (eventDescriptors.types && eventDescriptors.ids) {
        return await eventStore.subscribeByAggregateId(
            eventDescriptors.ids,
            event => eventDescriptors.types.includes(event.type) && callback(event),
            true
        );
    } else {
        throw new Error('Wrong parameter for event subscription');
    }
};

export { subscribe };

export default eventStore;
