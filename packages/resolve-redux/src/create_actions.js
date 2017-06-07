import actions from './actions';

export default function createActions({ name, commands }, extendActions) {
    const generatedActions = Object.keys(commands).reduce(
        (result, commandName) => ({
            ...result,
            [commandName]: (aggregateId, payload) =>
                actions.sendCommand({
                    aggregateId,
                    aggregateName: name,
                    command: {
                        type: commandName
                    },
                    payload
                })
        }),
        {}
    );

    return { ...generatedActions, ...extendActions };
}
