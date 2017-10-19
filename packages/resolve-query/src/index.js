import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';
import createMemoryAdapter from 'resolve-readmodel-memory';

const subscribeByEventTypeAndIds = async (eventStore, callback, eventDescriptors) => {
    const passedEvents = new WeakSet();
    const trigger = event => !passedEvents.has(event) && passedEvents.add(event) && callback(event);

    const conditionalSubscribe = (section, subscriber) =>
        Array.isArray(section) ? subscriber(section, trigger) : Promise.resolve(() => {});

    const unsubscribers = await Promise.all([
        conditionalSubscribe(eventDescriptors.types, eventStore.subscribeByEventType),
        conditionalSubscribe(eventDescriptors.ids, eventStore.subscribeByAggregateId)
    ]);

    return () => unsubscribers.forEach(func => func());
};

const init = async (adapter, eventStore, projection, onDemandOptions) => {
    if (projection === null) {
        adapter.init(onDemandOptions, Promise.resolve(), () => {});
        return;
    }

    const { aggregateIds, limitedEventTypes } = onDemandOptions || {};
    let unsubscriber = null;
    let onDestroy = () => (unsubscriber === null ? (onDestroy = null) : unsubscriber());

    const persistDonePromise = new Promise((resolve) => {
        let persistence = { eventsFetched: 0, eventsProcessed: 0, isLoaded: false };
        let flowPromise = Promise.resolve();

        const persistenceChecker = (doCount) => {
            if (!persistence) return;
            if (doCount) {
                persistence.eventsProcessed++;
            } else {
                persistence.isLoaded = true;
            }
            if (persistence.eventsProcessed === persistence.eventsFetched && persistence.isLoaded) {
                persistence = null;
                resolve();
            }
        };

        const synchronizedEventWorker = (event) => {
            if (event && event.type && typeof projection[event.type] === 'function') {
                flowPromise = flowPromise.then(
                    projection[event.type].bind(null, event, onDemandOptions)
                );
            }

            if (!persistence || persistence.isLoaded) return;
            flowPromise = flowPromise.then(persistenceChecker.bind(null, true));

            persistence.eventsFetched++;
        };

        subscribeByEventTypeAndIds(eventStore, synchronizedEventWorker, {
            types: Array.isArray(limitedEventTypes) || Array.isArray(aggregateIds)
                ? limitedEventTypes
                : Object.keys(projection),
            ids: aggregateIds
        }).then((unsub) => {
            persistenceChecker(false);

            if (onDestroy !== null) {
                unsubscriber = unsub;
            } else {
                unsub();
            }
        });
    });

    adapter.init(onDemandOptions, persistDonePromise, onDestroy);
    await persistDonePromise;
};

const read = async (adapter, eventStore, projection, onDemandOptions) => {
    if (!adapter.get(onDemandOptions)) {
        await init(adapter, eventStore, projection, onDemandOptions);
    }

    const { getError, getReadable } = adapter.get(onDemandOptions);
    const readableError = await getError();
    if (readableError) {
        throw readableError;
    }

    return await getReadable();
};

export default ({ readModel, eventStore }) => {
    const adapter = readModel.adapter || createMemoryAdapter();
    const projection = readModel.projection ? adapter.buildProjection(readModel.projection) : null;
    const wrappedRead = adapter.buildRead(read.bind(null, adapter, eventStore, projection));

    if (!readModel.gqlSchema && !readModel.gqlResolvers) return wrappedRead;

    const executableSchema = makeExecutableSchema({
        typeDefs: readModel.gqlSchema,
        resolvers: { Query: readModel.gqlResolvers }
    });

    return async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);

        const gqlResponse = await execute(
            executableSchema,
            parsedGqlQuery,
            wrappedRead,
            { getJwt },
            gqlVariables
        );

        if (gqlResponse.errors) throw gqlResponse.errors;
        return gqlResponse.data;
    };
};
