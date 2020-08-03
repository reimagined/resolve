import createQuery from 'resolve-query'

import as from './as'
import givenEvents from './given-events'
import { execute } from './execute'
import readModel from './read-model'
import transformEvents from './transform-events'
import { executeReadModel } from './execute-read-model'
import { executeSaga } from './execute-saga'
import { executeCommand } from './execute-command'
import saga from './saga'
import properties from './properties'
import getDefaultSecretsManager from './secrets-manager'
import setSecretsManager from './set-secrets-manager'
import { BDDAggregate } from './aggregate'

export { BDDAggregate }

export default givenEvents.bind(null, {
  createQuery,
  as,
  execute,
  executeSaga,
  executeReadModel,
  executeCommand,
  readModel,
  transformEvents,
  saga,
  properties,
  getDefaultSecretsManager,
  setSecretsManager
})

export const RESOLVE_SIDE_EFFECTS_START_TIMESTAMP =
  'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'
