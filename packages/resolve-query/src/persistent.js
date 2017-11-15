import 'regenerator-runtime/runtime';
import { makeExecutableSchema } from 'graphql-tools';
import { parse, execute } from 'graphql';
import createDefaultAdapter from 'resolve-readmodel-memory';

const init = (adapter, eventStore, projection) => {
    if (projection === null) {
        return {
            ...adapter.init(),
            onDispose: () => {}
        };
    }

    let unsubscriber = null;
    let onDispose = () => (unsubscriber === null ? (onDispose = null) : unsubscriber());

    const loadDonePromise = new Promise((resolve, reject) => {
        let loading = { eventsFetched: 0, eventsProcessed: 0, isLoaded: false };
        let flowPromise = Promise.resolve();

        const loadingChecker = (doCount) => {
            if (!loading) return;
            if (doCount) {
                loading.eventsProcessed++;
            } else {
                loading.isLoaded = true;
            }
            if (loading.eventsProcessed === loading.eventsFetched && loading.isLoaded) {
                loading = null;
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
                flowPromise = flowPromise.then(projection[event.type].bind(null, event), forceStop);
            }

            if (!loading || loading.isLoaded) return;
            flowPromise = flowPromise.then(loadingChecker.bind(null, true));

            loading.eventsFetched++;
        };

        eventStore
            .subscribeByEventType(Object.keys(projection), synchronizedEventWorker)
            .then((unsub) => {
                loadingChecker(false);

                if (onDispose !== null) {
                    unsubscriber = unsub;
                } else {
                    unsub();
                }
            });
    });

    return {
        ...adapter.init(),
        loadDonePromise,
        onDispose
    };
};

const read = async (repository, adapter, eventStore, projection) => {
    if (!repository.loadDonePromise) {
        Object.assign(repository, init(adapter, eventStore, projection));
    }

    const { getError, getReadable, loadDonePromise } = repository;
    await loadDonePromise;

    const readableError = await getError();
    if (readableError) {
        throw readableError;
    }

    return await getReadable();
};

const makePersistentExecutor = (readModel, eventStore) => {
    const adapter = readModel.adapter || createDefaultAdapter();
    const projection = readModel.projection ? adapter.buildProjection(readModel.projection) : null;
    const repository = {};
    const getReadModel = read.bind(null, repository, adapter, eventStore, projection);

    let executor = async (...args) => getReadModel(...args);

    if (readModel.gqlSchema || readModel.gqlResolvers) {
        const executableSchema = makeExecutableSchema({
            typeDefs: readModel.gqlSchema,
            resolvers: { Query: readModel.gqlResolvers }
        });

        executor = async (gqlQuery, gqlVariables, getJwt) => {
            const parsedGqlQuery = parse(gqlQuery);

            const gqlResponse = await execute(
                executableSchema,
                parsedGqlQuery,
                await getReadModel(),
                { getJwt },
                gqlVariables
            );

            if (gqlResponse.errors) throw gqlResponse.errors;
            return gqlResponse.data;
        };
    }

    executor.dispose = () => {
        if (!repository.persistDonePromise) return;
        repository.onDispose();

        Object.keys(repository).forEach((key) => {
            delete repository[key];
        });

        adapter.reset();
    };

    return executor;
};

export default makePersistentExecutor;
