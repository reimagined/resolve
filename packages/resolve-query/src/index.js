import 'regenerator-runtime/runtime';
import { PubSub } from 'graphql-subscriptions';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';
import { subscribe } from 'graphql/subscription';

const createMemoryAdapter = () => {
    const repository = {};

    const init = (key, onPersistDone = () => {}, onDestroy = () => {}) => {
        if (repository[key]) throw new Error(`State for '${key}' alreary initialized`);
        const persistPromise = new Promise(resolve => onPersistDone(resolve));

        repository[key] = {
            internalState: null,
            internalError: null,
            api: {
                getReadable: async () => persistPromise.then(() => repository[key].internalState),
                getError: async () => repository[key].internalError
            },
            onDestroy
        };

        return repository[key].api;
    };

    const buildProjection = (projection) => {
        return Object.keys(projection).reduce((result, name) => {
            result[name] = async (key, event, publish) => {
                if (!projection[name] || repository[key].internalError) return;

                try {
                    repository[key].internalState = await projection[name](
                        repository[key].internalState,
                        event,
                        publish
                    );
                } catch (error) {
                    repository[key].internalError = error;
                }
            };
            return result;
        }, {});
    };

    const wrapRead = read => (...args) => read(...args);

    const get = (key) => {
        return repository[key] ? repository[key].api : null;
    };

    const reset = (key) => {
        if (!repository[key]) return;
        repository[key].onDestroy();
        repository[key] = null;
    };

    return {
        buildProjection,
        wrapRead,
        init,
        get,
        reset
    };
};

const subscribeByEventTypeAndIds = async (eventStore, callback, eventDescriptors) => {
    const passedEventSet = new WeakSet();

    const trigger = (event) => {
        if (!passedEventSet.has(event)) {
            passedEventSet.add(event);
            callback(event);
        }
    };

    const typeUnsubPromise = Array.isArray(eventDescriptors.types)
        ? eventStore.subscribeByEventType(eventDescriptors.types, trigger)
        : Promise.resolve(() => {});

    const idUnsubPromise = Array.isArray(eventDescriptors.ids)
        ? eventStore.subscribeByAggregateId(eventDescriptors.ids, trigger)
        : Promise.resolve(() => {});

    const [typeUnsub, idUnsub] = await Promise.all([typeUnsubPromise, idUnsubPromise]);

    return () => {
        typeUnsub();
        idUnsub();
    };
};

const read = async (adapter, eventStore, projection, pubsub, onDemandOptions) => {
    const { aggregateIds, limitedEventTypes } = onDemandOptions || {};

    const key =
        'STATE' +
        (Array.isArray(aggregateIds) ? `\u200D\u200D${aggregateIds.sort().join('\u200D')}` : '') +
        (Array.isArray(limitedEventTypes)
            ? `\u200D\u200D${limitedEventTypes.sort().join('\u200D')}`
            : '');

    if (!adapter.get(key)) {
        let unsubscriber = null;
        let onDestroy = () => (unsubscriber === null ? (onDestroy = null) : unsubscriber());
        let persistenceDoneCallback = () => {};
        const onPersistDone = callback => (persistenceDoneCallback = callback || (() => {}));

        adapter.init(key, onPersistDone, onDestroy);

        await new Promise((resolve) => {
            let persistence = { eventsFetched: 0, eventsProcessed: 0, isLoaded: false };
            let flowPromise = Promise.resolve();

            const persistenceChecker = (doCount) => {
                if (!persistence) return;
                if (doCount) {
                    persistence.eventsProcessed++;
                } else {
                    persistence.isLoaded = true;
                }
                if (
                    persistence.eventsProcessed === persistence.eventsFetched &&
                    persistence.isLoaded
                ) {
                    persistence = null;
                    resolve();
                }
            };

            const publish = pubsub && typeof pubsub.publish === 'function'
                ? pubsub.publish.bind(pubsub)
                : () => {
                    throw new Error('Publishing DIFFs is not supported current model');
                };

            const synchronizedEventWorker = (event) => {
                flowPromise = flowPromise.then(
                    projection[event.type].bind(null, key, event, publish)
                );
                if (!persistence || persistence.isLoaded) return;
                persistence.eventsFetched++;
                flowPromise = flowPromise.then(persistenceChecker.bind(null, true));
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

        persistenceDoneCallback();
    }

    const { getError, getReadable } = adapter.get(key);

    const readableError = await getError();
    if (readableError) {
        throw readableError;
    }

    return await getReadable();
};

const createReadModelExecutor = (readModel, eventStore) => {
    const adapter = readModel.adapter || createMemoryAdapter();
    const projection = adapter.buildProjection(readModel.projection);
    const pubsub = new PubSub();

    let resolvers = {};
    if (readModel.gqlResolvers) {
        resolvers.Query = readModel.gqlResolvers;
    }
    if (readModel.gqlSubscriptionFactory) {
        resolvers.Subscription = readModel.gqlSubscriptionFactory(pubsub);
    }

    const executableSchema = makeExecutableSchema({
        typeDefs: readModel.gqlSchema,
        resolvers
    });

    const wrappedRead = adapter.wrapRead(read.bind(null, adapter, eventStore, projection, pubsub));

    const createWrappedGraphqlMethod = method => (_, parsedGqlQuery, __, options, gqlVariables) =>
        method(executableSchema, parsedGqlQuery, wrappedRead, options, gqlVariables);

    const executor = async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);

        const gqlResponse = await createWrappedGraphqlMethod(execute)(
            null,
            parsedGqlQuery,
            null,
            { getJwt },
            gqlVariables
        );

        if (gqlResponse.errors) throw gqlResponse.errors;
        return gqlResponse.data;
    };

    executor.getGraphql = () => ({
        execute: createWrappedGraphqlMethod(execute),
        subscribe: createWrappedGraphqlMethod(subscribe),
        schema: executableSchema
    });

    return executor;
};

const extractAggregateIdsFromGqlQuery = (parsedGqlQuery, gqlVariables) => {
    try {
        const aggregateIds = [];
        const selection = parsedGqlQuery.definitions[0].selectionSet.selections[0];
        if (selection.name.kind !== 'Name' || selection.name.value !== 'View') {
            throw new Error();
        }
        if (Array.isArray(selection.arguments)) {
            selection.arguments.forEach((arg) => {
                if (arg.name.kind !== 'Name' || arg.name.value !== 'aggregateId') {
                    throw new Error();
                }
                if (arg.value.kind === 'Variable' && arg.value.name && arg.value.name.value) {
                    aggregateIds.push(gqlVariables[arg.value.name.value]);
                } else {
                    aggregateIds.push(arg.value.value);
                }
            });
        }
        return aggregateIds.length > 0 ? aggregateIds : null;
    } catch (err) {
        throw new Error( // eslint-disable-next-line max-len
            'View model is queryable only by "query { View }" or "query { View(aggregateId: ID) }"'
        );
    }
};

const createViewModelExecutor = (readModel, eventStore) => {
    if (readModel.gqlSchema || readModel.gqlResolvers) {
        throw new Error('View model can\'t have GraphQL schemas and resolvers');
    } else if (readModel.storageAdapter) {
        throw new Error('View model can\'t have custom storage Adapter');
    }

    const adapter = createMemoryAdapter();
    const projection = adapter.buildProjection(readModel.projection);

    const wrappedRead = adapter.wrapRead(read.bind(null, adapter, eventStore, projection, null));

    const executor = async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);
        return await wrappedRead({
            aggregateIds: extractAggregateIdsFromGqlQuery(parsedGqlQuery, gqlVariables)
        });
    };

    executor.getGraphql = () => {
        throw new Error('View models does not support Graphql');
    };

    return executor;
};

export default ({ readModel, eventStore }) => {
    try {
        return readModel.viewModel
            ? createViewModelExecutor(readModel, eventStore)
            : createReadModelExecutor(readModel, eventStore);
    } catch (err) {
        throw new Error(`Error ${err.description} due query-side initialization: ${err.stack}`);
    }
};
