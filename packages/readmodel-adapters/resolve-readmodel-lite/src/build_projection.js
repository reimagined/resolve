export default function buildProjection(repository, inputProjection) {
    repository.initHandler = async () => {};

    return Object.keys(inputProjection).reduce((projection, eventType) => {
        if (eventType === 'Init') {
            repository.initHandler = inputProjection[eventType];
            return projection;
        }

        projection[eventType] = async (event, onDemandOptions) => {
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
