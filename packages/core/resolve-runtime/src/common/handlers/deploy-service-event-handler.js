const Lambda = require('aws-sdk/clients/lambda')
const lambda = new Lambda()

const handleResolveReadModelEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.operation) {
    case 'reset': {
      const { DEPLOYMENT_ID } = process.env
      for (const { name } of resolve.readModels) {
        await lambda
          .invoke({
          FunctionName: `${DEPLOYMENT_ID}-meta-lock`,
          Payload: JSON.stringify({
            listenerId: name,
            command: 'reset'
          })
        })
        .promise()
        await resolve.executeQuery.drop(name)
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
