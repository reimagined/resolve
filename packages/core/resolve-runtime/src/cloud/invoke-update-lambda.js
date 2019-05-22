import debugLevels from 'debug-levels'
import uuid from 'uuid/v4'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const invokeUpdateLambda = async (
  { stepFunctions },
  { name: listenerId, invariantHash, projection }
) => {
  log.debug(
    `requesting step function execution to update read-model/saga "${listenerId}"`
  )
  await stepFunctions
    .startExecution({
      stateMachineArn: process.env.RESOLVE_EVENT_BUS_STEP_FUNCTION_ARN,
      name: `FEED-${listenerId}-${uuid()}`,
      input: JSON.stringify({
        'detail-type': 'LISTEN_EVENT_BUS',
        listenerId,
        invariantHash,
        inactiveTimeout: 1000 * 60 * 60,
        eventTypes: Object.keys(projection)
      })
    })
    .promise()
}

export default invokeUpdateLambda
