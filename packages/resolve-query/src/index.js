import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';
import objectHash from 'object-hash';
import createMemoryAdapter from 'resolve-readmodel-memory';

const hash = (onDemandOptions = null) => {
    return objectHash(onDemandOptions, {
        unorderedArrays: true,
        unorderedSets: true
    });
};

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

const init = (adapter, eventStore, projection, onDemandOptions = {}) => {
    if (projection === null) {
        return {
            ...adapter.init(onDemandOptions),
            onDispose: () => {}
        };
    }

    const { aggregateIds, eventTypes } = onDemandOptions;
    let unsubscriber = null;
    let onDispose = () => (unsubscriber === null ? (onDispose = null) : unsubscriber());

    const persistDonePromise = new Promise((resolve, reject) => {
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

        const forceStop = (reason) => {
            flowPromise = flowPromise.then(reject, reject);
            flowPromise = null;
            onDispose && onDispose();
            return Promise.reject(reason);
        };

        const synchronizedEventWorker = (event) => {
            if (!flowPromise) return;

            if (event && event.type && typeof projection[event.type] === 'function') {
                flowPromise = flowPromise.then(
                    projection[event.type].bind(null, event, onDemandOptions),
                    forceStop
                );
            }

            if (!persistence || persistence.isLoaded) return;
            flowPromise = flowPromise.then(persistenceChecker.bind(null, true));

            persistence.eventsFetched++;
        };

        subscribeByEventTypeAndIds(eventStore, synchronizedEventWorker, {
            types:
                Array.isArray(eventTypes) || Array.isArray(aggregateIds)
                    ? eventTypes
                    : Object.keys(projection),
            ids: aggregateIds
        }).then((unsub) => {
            persistenceChecker(false);

            if (onDispose !== null) {
                unsubscriber = unsub;
            } else {
                unsub();
            }
        });
    });

    return {
        ...adapter.init(onDemandOptions),
        persistDonePromise,
        onDispose
    };
};

const read = async (repository, adapter, eventStore, projection, onDemandOptions) => {
    const key = hash(onDemandOptions || {});
    if (!repository.has(key)) {
        repository.set(key, init(adapter, eventStore, projection, onDemandOptions));
    }

    const { getError, getReadable, persistDonePromise } = repository.get(key);
    await persistDonePromise;

    const readableError = await getError();
    if (readableError) {
        throw readableError;
    }

    return await getReadable();
};

const extractFieldsFromGqlQuery = (parsedGqlQuery, gqlVariables, fieldName) => {
    try {
        const values = [];
        const selection = parsedGqlQuery.definitions[0].selectionSet.selections[0];
        if (Array.isArray(selection.arguments)) {
            selection.arguments.forEach((arg) => {
                if (arg.name.kind !== 'Name' || arg.name.value !== fieldName) return;
                if (arg.value.kind === 'Variable' && arg.value.name && arg.value.name.value) {
                    values.push(gqlVariables[arg.value.name.value]);
                } else {
                    values.push(arg.value.value);
                }
            });
        }
        return values.length > 0 ? values : null;
    } catch (err) {
        return null;
    }
};

const makeGqlExecutor = (getReadModel, readModel) => {
    const executableSchema = makeExecutableSchema({
        typeDefs: readModel.gqlSchema,
        resolvers: { Query: readModel.gqlResolvers }
    });

    return async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);
        const extractFields = extractFieldsFromGqlQuery.bind(null, parsedGqlQuery, gqlVariables);
        const aggregateIds = extractFields('aggregateId');
        const eventTypes = extractFields('eventType');

        const defaultReadable = await getReadModel({ aggregateIds, eventTypes });

        const gqlResponse = await execute(
            executableSchema,
            parsedGqlQuery,
            defaultReadable,
            { getJwt },
            gqlVariables
        );

        if (gqlResponse.errors) throw gqlResponse.errors;
        return gqlResponse.data;
    };
};

const extendDispose = (repository, adapter, executor) => {
    executor.dispose = (onDemandOptions) => {
        if (!onDemandOptions) {
            repository.forEach(storePromise => storePromise.then(({ onDispose }) => onDispose()));
            repository.clear();
            adapter.reset();
            return;
        }

        const key = hash(onDemandOptions);
        if (!repository.has(key)) return;

        repository.get(key).then(({ onDispose }) => onDispose());
        repository.delete(key);
        adapter.reset(onDemandOptions);
    };
    return executor;
};

export default ({ readModel, eventStore }) => {
    const adapter = readModel.adapter || createMemoryAdapter();
    const projection = readModel.projection ? adapter.buildProjection(readModel.projection) : null;
    const repository = new Map();
    const getReadModel = read.bind(null, repository, adapter, eventStore, projection);
    const makeDisposable = extendDispose.bind(null, repository, adapter);

    if (!readModel.gqlSchema && !readModel.gqlResolvers) {
        return makeDisposable(getReadModel);
    }

    const executor = makeGqlExecutor(getReadModel, readModel);
    return makeDisposable(executor);
};
