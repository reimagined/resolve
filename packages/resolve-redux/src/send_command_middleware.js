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
                store.dispatch({
                    ...action,
                    command: {
                        ...action.command,
                        error
                    }
                });
            });
    }

    return next(action);
};
