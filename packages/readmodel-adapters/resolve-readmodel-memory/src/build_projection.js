import clone from 'clone';
import hash from './hash';

export default function buildProjection(repository, collections) {
    let preparedCollections;
    if (Array.isArray(collections)) {
        preparedCollections = collections;
    } else {
        preparedCollections = [
            {
                name: 'default',
                projection: collections,
                initialState: []
            }
        ];
    }

    repository.collections = preparedCollections;

    const callbacks = preparedCollections.reduce(
        (callbacks, { name, projection, initialState }) =>
            Object.keys(projection).reduce((result, eventType) => {
                result[eventType] = (result[eventType] || []).concat({
                    name,
                    handler: projection[eventType],
                    initialState: clone(initialState)
                });
                return result;
            }, callbacks),
        {}
    );

    return Object.keys(callbacks).reduce((projection, eventType) => {
        projection[eventType] = async (event, onDemandOptions) => {
            const key = hash(onDemandOptions);

            for (const { name, handler, initialState } of callbacks[eventType]) {
                const state = repository.get(key).internalState;

                if (!state.has(name)) {
                    state.set(name, initialState);
                }

                try {
                    state.set(name, await handler(state.get(name), event));
                } catch (error) {
                    repository.get(key).internalError = error;
                }
            }
        };
        return projection;
    }, {});
}
