import 'regenerator-runtime/runtime';

export default function buildProjection(repository, inputProjection) {
    return Object.keys(inputProjection).reduce((projection, eventType) => {
        if (eventType === 'Init' && typeof inputProjection[eventType] === 'function') {
            repository.initHandler = inputProjection[eventType];
            return projection;
        }

        projection[eventType] = async (event, onDemandOptions) => {
            await repository.initDonePromise;
            const writeInterface = repository.writeInterface;
            const handler = inputProjection[eventType];

            try {
                await handler(writeInterface, event);
            } catch (error) {
                repository.internalError = error;
            }
        };
        return projection;
    }, {});
}
