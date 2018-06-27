import { sendCommandRequest } from './actions'

export default function createActions({ name, commands }, extendActions) {
  const generatedActions = Object.keys(commands).reduce(
    (result, commandType) => ({
      ...result,
      [commandType]: (aggregateId, payload) =>
        sendCommandRequest(commandType, aggregateId, name, payload)
    }),
    {}
  )

  return { ...generatedActions, ...extendActions }
}
