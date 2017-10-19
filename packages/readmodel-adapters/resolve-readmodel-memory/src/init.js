import hash from './hash';

export default function init(repository, onDemandOptions, persistDonePromise, onDestroy) {
    const key = hash(onDemandOptions);

    if (repository.get(key)) {
        throw new Error(`State for '${key}' already initialized`);
    }

    repository.set(key, {
        internalState: new Map(),
        internalError: null,
        api: {
            getReadable: async () => {
                await persistDonePromise;
                return repository.get(key).internalState;
            },
            getError: async () => repository.get(key).internalError
        },
        onDestroy
    });
}
