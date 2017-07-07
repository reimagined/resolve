import checkRequiredFields from './warn_util';

export default params => store => next => (action) => {
    const { command, aggregateId, aggregateName, payload } = action;
    if (
        command &&
        checkRequiredFields(
            { aggregateId, aggregateName },
            'Send command error:',
            JSON.stringify(action)
        )
    ) {
        params
            .sendCommand({
                type: command.type,
                aggregateId,
                aggregateName,
                payload
            })
            .catch((error) => {
                const errorAction = Object.keys(action).reduce(
                    (result, field) =>
                        field === 'command' ? result : { ...result, [field]: action[field] },
                    { status: 'error', error }
                );
                store.dispatch(errorAction);
            });
    }

    return next(action);
};
