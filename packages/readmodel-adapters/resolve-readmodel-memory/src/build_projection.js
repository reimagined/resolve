export default function buildProjection(repository, inputProjection) {
    repository.initHandler = async () => {};
    repository.initDone = false;

    return Object.keys(inputProjection).reduce((projection, eventType) => {
        if (eventType === 'Init' && typeof inputProjection[eventType] === 'function') {
            repository.initHandler = inputProjection[eventType];
            return projection;
        }

        projection[eventType] = async (event, onDemandOptions) => {
            const writeInterface = repository.writeInterface;
            if (!repository.initDone) {
                try {
                    await repository.initHandler(writeInterface);
                } catch (error) {
                    repository.internalError = error;
                }
                repository.initDone = true;
            }

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
