import { getClient as getClientInternal, Context } from 'resolve-client'

const origin = process.env.RESOLVE_API_TESTS_ORIGIN || 'http://0.0.0.0:3000'

const context: Context = {
  viewModels: [],
  origin,
  rootPath: '',
  staticPath: 'static'
}

export const getClient = getClientInternal.bind(null, context)
