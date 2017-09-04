import createEventStore from 'resolve-es';

import config from '../configs/server.config.js';

const storage = config.storage.driver(config.storage.params);

const busDriver = config.bus.driver;
const bus = busDriver(config.bus.params);

const eventStore = createEventStore({ storage, bus });

const subscribe = async (eventDescriptors, callback) => {
    if (Array.isArray(eventDescriptors)) {
        return await eventStore.subscribeByEventType(eventDescriptors, callback, true);
    } else if (eventDescriptors.types || eventDescriptors.ids) {
        const passedEventSet = new WeakSet();

        const trigger = (event) => {
            if (!passedEventSet.has(event)) {
                passedEventSet.add(event);
                callback(event);
            }
        };

        const typeUnsubPromise = Array.isArray(eventDescriptors.types)
            ? eventStore.subscribeByEventType(eventDescriptors.types, trigger, true)
            : Promise.resolve(() => {});

        const idUnsubPromise = Array.isArray(eventDescriptors.ids)
            ? eventStore.subscribeByAggregateId(eventDescriptors.ids, trigger, true)
            : Promise.resolve(() => {});

        const [typeUnsub, idUnsub] = await Promise.all(typeUnsubPromise, idUnsubPromise);

        return () => {
            typeUnsub();
            idUnsub();
        };
    } else {
        throw new Error('Wrong parameter for event subscription');
    }
};

export { subscribe };

export default eventStore;
