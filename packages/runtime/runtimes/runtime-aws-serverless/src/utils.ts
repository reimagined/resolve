const varName = 'RESOLVE_DEPLOYMENT_ID'

export const getDeploymentId = (): string => {
  const deploymentId = process.env[varName]
  if (deploymentId == null || deploymentId.trim() === '') {
    throw Error(
      `Cannot determine cloud deployment id, check ${varName} lambda env var`
    )
  }
  return deploymentId
}
