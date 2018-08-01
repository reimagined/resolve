import { sendCommandRequest } from './actions'

const createActions = ({ name, commands }, extendActions) => {
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

export default createActions
