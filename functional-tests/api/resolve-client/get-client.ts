import { getClient as getClientInternal, Context } from 'resolve-client'
import deserializeState from '../../app/common/view-models/custom-serializer.deserialize'

const origin = process.env.RESOLVE_API_TESTS_TARGET_URL || 'http://0.0.0.0:3000'

const context: Context = {
  viewModels: [
    {
      name: 'custom-serializer',
      deserializeState,
      projection: {
        Init: () => null,
      },
    },
  ],
  origin,
  rootPath: '',
  staticPath: 'static',
}

export const getClient = getClientInternal.bind(null, context)
