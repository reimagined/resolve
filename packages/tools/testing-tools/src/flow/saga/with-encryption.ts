import partial from 'lodash.partial'
import { SagaContext } from '../../types'
import { SagaNode } from './saga'
import { EventHandlerEncryptionFactory } from '@resolve-js/core'
import { withAdapter } from './with-adapter'
import { withSecretsManager } from './with-secrets-manager'
import { allowSideEffects } from './allow-side-effects'
import { startSideEffectsFrom } from './start-side-effects-from'

type WithEncryption = Omit<SagaNode, 'withEncryption'>

export const withEncryption = (
  context: SagaContext,
  encryption: EventHandlerEncryptionFactory
): WithEncryption => {
  if (context.encryption != null) {
    throw Error(`Saga encryption already assigned.`)
  }

  // FIXME: check isExecuted

  context.encryption = encryption

  return Object.assign(context.environment.promise, {
    withAdapter: partial(withAdapter, context),
    withSecretsManager: partial(withSecretsManager, context),
    allowSideEffects: partial(allowSideEffects, context),
    startSideEffectsFrom: partial(startSideEffectsFrom, context),
  })
}
