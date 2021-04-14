export const getCommandImplementationKey = ({
  type,
  aggregateName,
}: {
  type: string
  aggregateName: string
}) => `${aggregateName}:${type}`
