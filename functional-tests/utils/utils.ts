import { getClient as getClientInternal, Context } from '@resolve-js/client'

import monitoringResolver from '../app/common/view-models/resolver-failed.resolver'
import monitoringProjection from '../app/common/view-models/monitoring.projection'

import initFailedProjection from '../app/common/view-models/init-failed.projection'

import resolverFailedProjection from '../app/common/view-models/resolver-failed.projection'
import resolverFailedResolver from '../app/common/view-models/resolver-failed.resolver'

export const getTargetURL = () =>
  process.env.RESOLVE_TESTS_TARGET_URL || 'http://0.0.0.0:3000'

const buildContext = (contextOverrides: any): Context => ({
  origin: getTargetURL(),
  rootPath: '',
  staticPath: 'static',
  viewModels: [
    {
      name: 'monitoring-view-model',
      resolver: monitoringResolver,
      projection: monitoringProjection,
      deserializeState: (state) => JSON.parse(state),
    },
    {
      name: 'init-failed-view-model',
      projection: initFailedProjection,
      resolver: () => void 0,
      deserializeState: (state) => JSON.parse(state),
    },
    {
      name: 'resolver-failed-view-model',
      projection: resolverFailedProjection,
      resolver: resolverFailedResolver,
      deserializeState: (state) => JSON.parse(state),
    },
  ],
  ...contextOverrides,
})

export const getClient = (contextOverrides: any = {}) =>
  getClientInternal(buildContext(contextOverrides))
