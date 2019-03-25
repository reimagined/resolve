const handleResolveReadModelEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent.operation) {
    case 'reset': {
      for (const { name } of resolve.readModels) {
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
