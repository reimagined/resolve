import bootstrap from '../bootstrap'

const handleResolveReadModelEvent = async (
  lambdaEvent,
  { lambda, executeQuery, readModels }
) => {
  switch (lambdaEvent.operation) {
    case 'reset':
    case 'pause':
    case 'resume': {
      const names = lambdaEvent.name
        ? [lambdaEvent.name]
        : readModels.map(readModel => readModel.name)
      const { DEPLOYMENT_ID } = process.env
      for (const name of names) {
        await lambda
          .invoke({
            FunctionName: `${DEPLOYMENT_ID}-meta-lock`,
            Payload: JSON.stringify({
              listenerId: name,
              operation: lambdaEvent.operation
            })
          })
          .promise()

        if (lambdaEvent.operation === 'reset') {
          await executeQuery.drop(name)
        }
      }
      return 'ok'
    }
    case 'list': {
      const { DEPLOYMENT_ID } = process.env

      return Promise.all(
        readModels.map(async readModel => {
          const state = await lambda
            .invoke({
              FunctionName: `${DEPLOYMENT_ID}-meta-lock`,
              Payload: JSON.stringify({
                listenerId: readModel.name,
                operation: 'status'
              })
            })
            .promise()

          return {
            ...state,
            name: readModel.name
          }
        })
      )
    }
    default: {
      return null
    }
  }
}

const handleDeployServiceEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.part) {
    case 'bootstrap': {
      return await bootstrap(resolve)
    }
    case 'readModel': {
      return await handleResolveReadModelEvent(lambdaEvent, resolve)
    }
    default: {
      return null
    }
  }
}

export default handleDeployServiceEvent
