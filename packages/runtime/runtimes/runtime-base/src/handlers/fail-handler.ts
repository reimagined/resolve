import debugLevels from '@resolve-js/debug-levels'
import type { ResolveRequest, ResolveResponse } from '../types'

const log = debugLevels('resolve:runtime:fail-handler')

export const failHandler = async (
  { method, path }: ResolveRequest,
  res: ResolveResponse
) => {
  const errorText = `${method} "${path}": handler does not exist`
  await res.status(405)
  await res.end(errorText)
  log.warn(errorText)
}
