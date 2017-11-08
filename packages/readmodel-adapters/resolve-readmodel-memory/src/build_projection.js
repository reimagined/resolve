import hash from './hash';

export default function buildProjection(repository, inputProjection) {
    repository.initHandler = async () => {};

    return Object.keys(inputProjection).reduce((projection, eventType) => {
        if (eventType === '@@INIT') {
            repository.initHandler = inputProjection[eventType];
        }

        projection[eventType] = async (event, onDemandOptions) => {
            const key = hash(onDemandOptions);
            try {
                await repository.get(key).initializeKey;
            } catch (error) {
                repository.get(key).internalError = error;
                return;
            }

            const writeInterface = repository.get(key).writeInterface;
            const handler = inputProjection[eventType];

            try {
                await handler(writeInterface, event);
            } catch (error) {
                repository.get(key).internalError = error;
            }
        };
        return projection;
    }, {});
}
