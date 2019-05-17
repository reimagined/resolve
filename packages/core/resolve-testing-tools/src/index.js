import createQuery from 'resolve-query'

import as from './as'
import getInitPromise from './get-init-promise'
import givenEvents from './given-events'
import init from './init'
import readModel from './read-model'
import transformEvents from './transform-events'
import initReadModel from './init-read-model'
import initSaga from './init-saga'
import saga from './saga'
import properties from './properties'

export default givenEvents.bind(null, {
  createQuery,
  as,
  getInitPromise,
  init,
  initSaga,
  initReadModel,
  readModel,
  transformEvents,
  saga,
  properties
})

export const RESOLVE_SIDE_EFFECTS_START_TIMESTAMP =
  'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'
