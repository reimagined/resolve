// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'

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

export const getServerAssemblies = (handlerPath: string) =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  interopRequireDefault(require(handlerPath)).default
