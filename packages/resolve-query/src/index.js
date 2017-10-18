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

const createReadModelExecutor = (readModel, eventStore) => {
    const adapter = readModel.adapter || createMemoryAdapter();
    const projection = adapter.buildProjection(readModel.projection);

    const executableSchema = makeExecutableSchema({
        typeDefs: readModel.gqlSchema,
        resolvers: { Query: readModel.gqlResolvers }
    });

    const wrappedRead = adapter.buildRead(read.bind(null, adapter, eventStore, projection));

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

const extractVariablesFromGqlSelection = (selection, gqlVariables, varibaleNames) => {
    return varibaleNames.reduce((result, { innerName, outerName }) => {
        const values = [];
        if (Array.isArray(selection.arguments)) {
            selection.arguments.forEach((arg) => {
                if (arg.name.kind !== 'Name' || arg.name.value !== innerName) return;
                if (arg.value.kind === 'Variable' && arg.value.name && arg.value.name.value) {
                    values.push(gqlVariables[arg.value.name.value]);
                } else {
                    values.push(arg.value.value);
                }
            });
        }
        result[outerName] = null;
        if (values.length > 0) {
            result[outerName] = values;
        }
        return result;
    }, {});
};

const checkViewModelProjection = (projection) => {
    const projectionErrors = [];
    if (projection.constructor !== Object) {
        projectionErrors.push('Projection should be simple key-value object');
        return projectionErrors;
    }

    // View-model reducer should follow rules for redux reducers and be syncronious function
    // https://github.com/reactjs/redux/blob/df770cfc411e272e/src/combineReducers.js#L57
    Object.keys(projection).forEach((eventName) => {
        const eventHandler = projection[eventName];
        const baseError = `Event handler ${eventName} should`;
        if (typeof eventHandler !== 'function') {
            projectionErrors.push(`${baseError} be function`);
            return;
        }
        if (eventHandler.length !== 2) {
            projectionErrors.push(`${baseError} have signature (state, event) => state`);
        }
        try {
            const result = eventHandler(undefined, { type: eventName });
            if (result === undefined) {
                projectionErrors.push(`${baseError} not return undefined as result state`);
            } else if (Promise.resolve(result) === result) {
                projectionErrors.push(`${baseError} not be async function or return Promise`);
            } else if (result && result.__proto__ === (function*() {})().__proto__) {
                projectionErrors.push(`${baseError} not return generator`);
            }
        } catch (err) {
            projectionErrors.push(`${baseError} not throw error on empty state and event`);
        }
    });

    return projectionErrors;
};

const createViewModelExecutor = (readModel, eventStore) => {
    if (readModel.gqlSchema || readModel.gqlResolvers) {
        throw new Error('View model can\'t have GraphQL schemas and resolvers');
    }
    const projectionErrors = checkViewModelProjection(readModel.projection);
    if (projectionErrors.length > 0) {
        throw new Error(
            'View model projection declatation violates redux invariance: \n' +
                projectionErrors.join('\n')
        );
    }

    const adapter = createMemoryAdapter();
    const projection = adapter.buildProjection(readModel.projection);
    const wrappedRead = adapter.buildRead(read.bind(null, adapter, eventStore, projection));

    return async (gqlQuery, gqlVariables, getJwt) => {
        const parsedGqlQuery = parse(gqlQuery);
        const selection = parsedGqlQuery.definitions[0].selectionSet.selections[0];
        if (selection.name.kind !== 'Name' || selection.name.value !== 'View') {
            throw new Error(
                'View model can be retrieved only by "query { View }" query\n' +
                    'Allowed arguments is only "aggregateIds" and "limitedEventTypes"'
            );
        }

        const fieldset = extractVariablesFromGqlSelection(selection, gqlVariables, [
            { innerName: 'aggregateId', outerName: 'aggregateIds' },
            { innerName: 'limitedEventType', outerName: 'limitedEventTypes' }
        ]);

        return await wrappedRead(fieldset);
    };
};

export default ({ readModel, eventStore }) => {
    return readModel.viewModel
        ? createViewModelExecutor(readModel, eventStore)
        : createReadModelExecutor(readModel, eventStore);
};
