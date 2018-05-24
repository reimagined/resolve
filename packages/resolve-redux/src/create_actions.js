import actions from './actions';

export default function createActions({ name, commands }, extendActions) {
  const generatedActions = Object.keys(commands).reduce(
    (result, commandType) => ({
      ...result,
      [commandType]: (aggregateId, payload) =>
        actions.sendCommand({
          aggregateId,
          aggregateName: name,
          command: {
            type: commandType
          },
          payload
        })
    }),
    {}
  );

  return { ...generatedActions, ...extendActions };
}
