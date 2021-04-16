export const getCommandImplementationKey = ({
  type,
  aggregateName,
}: {
  type: string
  aggregateName: string
}) => `${aggregateName}:${type}`

export const getQueryImplementationKey = ({
  modelName,
  resolverName,
}: {
  modelName: string
  resolverName: string
}) => `${modelName}:${resolverName}`
