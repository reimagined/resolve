import checkRequiredFields from './warn_util';

export default params => store => next => (action) => {
    const { command, aggregateId, aggregateName, payload } = action;
    if (
        command &&
        checkRequiredFields(
            { aggregateId, aggregateName },
            'Send command error:',
            JSON.stringify(action)
        ) &&
        !command.error
    ) {
        params
            .sendCommand({
                type: command.type,
                aggregateId,
                aggregateName,
                payload
            })
            .catch((error) => {
                const errorAction = { ...action };
                errorAction.command.error = error;
                store.dispatch(errorAction);
            });
    }

    return next(action);
};
