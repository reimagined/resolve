import partial from 'lodash.partial'
import { SecretsManager } from '@resolve-js/core'
import { SagaContext } from '../../types'
import { SagaNode } from './saga'
import { withAdapter } from './with-adapter'
import { withEncryption } from './with-encryption'
import { allowSideEffects } from './allow-side-effects'
import { startSideEffectsFrom } from './start-side-effects-from'
import { makeAssertions } from './make-assertions'

type WithSecretsManagerNode = Omit<SagaNode, 'withSecretsManager'>

export const withSecretsManager = (
  context: SagaContext,
  manager: SecretsManager
): WithSecretsManagerNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Secrets manager cannot be assigned if the test was executed.`)
  }

  environment.setSecretsManager(manager)

  return Object.assign(makeAssertions(context), {
    withAdapter: partial(withAdapter, context),
    withEncryption: partial(withEncryption, context),
    allowSideEffects: partial(allowSideEffects, context),
    startSideEffectsFrom: partial(startSideEffectsFrom, context),
  })
}
