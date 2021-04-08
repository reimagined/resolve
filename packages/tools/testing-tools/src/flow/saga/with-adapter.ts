import partial from 'lodash.partial'
import { SagaContext } from '../../types'
import { SagaNode } from './saga'
import { withEncryption } from './with-encryption'
import { withSecretsManager } from './with-secrets-manager'
import { allowSideEffects } from './allow-side-effects'
import { startSideEffectsFrom } from './start-side-effects-from'
import { makeAssertions } from './make-assertions'

type WithAdapterNode = Omit<SagaNode, 'withAdapter'>

export const withAdapter = (
  context: SagaContext,
  adapter: any
): WithAdapterNode => {
  if (context.environment.isExecuted()) {
    throw Error(`Adapter cannot be assigned if the test was executed.`)
  }

  if (context.adapter != null) {
    throw Error(`Saga storage adapter already assigned.`)
  }

  context.adapter = adapter

  return Object.assign(makeAssertions(context), {
    withEncryption: partial(withEncryption, context),
    withSecretsManager: partial(withSecretsManager, context),
    allowSideEffects: partial(allowSideEffects, context),
    startSideEffectsFrom: partial(startSideEffectsFrom, context),
  })
}
