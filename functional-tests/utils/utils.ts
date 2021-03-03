import { getClient as getClientInternal, Context } from '@resolve-js/client'

export const getTargetURL = () =>
  process.env.RESOLVE_TESTS_TARGET_URL || 'http://0.0.0.0:3000'

const buildContext = (contextOverrides: any): Context => ({
  origin: getTargetURL(),
  rootPath: '',
  staticPath: 'static',
  ...contextOverrides,
})

export const getClient = (contextOverrides: any = {}) =>
  getClientInternal(buildContext(contextOverrides))
