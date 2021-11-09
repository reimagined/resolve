import readModels from '$resolve.readModels'

const healthCheck = async (req, res) => {
  const statuses = await Promise.all(
    readModels.map(async (readModel) => {
      const status = await req.resolve.executeQuery.status({
        modelName: readModel.name,
        includeRuntimeStatus: true,
      })
      return {
        readModelName: readModel.name,
        isAlive: status.isAlive,
      }
    })
  )

  res.json(statuses)
}

export default healthCheck
