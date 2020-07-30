import createQuery from 'resolve-query'

import as from './as'
import givenEvents from './given-events'
import init from './init'
import readModel from './read-model'
import transformEvents from './transform-events'
import initReadModel from './init-read-model'
import initSaga from './init-saga'
import saga from './saga'
import properties from './properties'
import getDefaultSecretsManager from './secrets-manager'
import setSecretsManager from './set-secrets-manager'

export default givenEvents.bind(null, {
  createQuery,
  as,
  init,
  initSaga,
  initReadModel,
  readModel,
  transformEvents,
  saga,
  properties,
  getDefaultSecretsManager,
  setSecretsManager
})

export const RESOLVE_SIDE_EFFECTS_START_TIMESTAMP =
  'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'
