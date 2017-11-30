import 'regenerator-runtime/runtime';
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
            if (flowPromise) {
                flowPromise.then(reject, reject);
                flowPromise = null;
                if (onDispose) {
                    onDispose();
                }
            }

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

const read = async (repository, adapter, eventStore, projection, ...args) => {
    if (!repository.loadDonePromise) {
        Object.assign(repository, init(adapter, eventStore, projection));
    }

    const { getError, getReadable, loadDonePromise } = repository;
    await loadDonePromise;

    const readableError = await getError();
    if (readableError) {
        throw readableError;
    }

    return await getReadable(...args);
};

const createReadModel = ({ projection, eventStore, adapter }) => {
    const currentAdapter = adapter || createDefaultAdapter();
    const builtProjection = projection ? currentAdapter.buildProjection(projection) : null;
    const repository = {};
    const getReadModel = read.bind(null, repository, currentAdapter, eventStore, builtProjection);

    const reader = async (...args) => await getReadModel(...args);

    reader.dispose = () => {
        if (!repository.loadDonePromise) return;
        repository.onDispose();
        Object.keys(repository).forEach((key) => {
            delete repository[key];
        });

        currentAdapter.reset();
    };

    return reader;
};

export default createReadModel;
