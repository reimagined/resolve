import hash from './hash'

export default function buildProjection(repository, collections) {
    const preparedCollections = [].concat(collections)

    const callbacks = preparedCollections.reduce(
        (callbacks, { name = 'default', eventHandlers, initialState }) =>
            Object.keys(eventHandlers).reduce((result, eventType) => {
                result[eventType] = (result[eventType] || []).concat({
                    name,
                    handler: eventHandlers[eventType],
                    initialState
                });
                return result;
            }, callbacks),
        {}
      );

    return Object.keys(callbacks).reduce((projection, eventType) => {
        projection[eventType] = (event, onDemandOptions) => {
            const key = hash(onDemandOptions);

            callbacks[eventType].forEach(({ name = 'default', handler, initialState }) => {
                const state = repository.get(key).internalState;

                if (!state.has(name)) {
                    state.set(name, initialState);
                }

                try {
                    state.set(name, handler(state.get(name), event));
                } catch (error) {
                    repository.get(key).internalError = error;
                }
            });
        };
        return projection;
    }, {});
}