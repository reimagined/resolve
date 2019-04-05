const Lambda = require('aws-sdk/clients/lambda')
const lambda = new Lambda()

const handleResolveReadModelEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.operation) {
    case 'reset':
    case 'pause':
    case 'resume': {
      const names = lambdaEvent.name
        ? [lambdaEvent.name]
        : resolve.readModels.map(readmodel => readmodel.name)
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
          await resolve.executeQuery.drop(name)
        }
      }
      return 'ok'
    }
    case 'list': {
      return resolve.readModels.map(readModel => readModel.name)
    }
    default: {
      return null
    }
  }
}

const handleDeployServiceEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.part) {
    case 'readModel': {
      return await handleResolveReadModelEvent(lambdaEvent, resolve)
    }
    default: {
      return null
    }
  }
}

export default handleDeployServiceEvent
