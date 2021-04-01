import partial from 'lodash.partial'
import { SagaContext } from '../../types'
import { SagaNode } from './saga'
import { withAdapter } from './with-adapter'
import { withEncryption } from './with-encryption'
import { withSecretsManager } from './with-secrets-manager'

type WithSecretsManagerNode = Omit<SagaNode, 'allowSideEffects'>

export const allowSideEffects = (
  context: SagaContext
): WithSecretsManagerNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Side effects cannot be allowed if the test was executed.`)
  }

  environment.allowSideEffects()

  return Object.assign(environment.promise, {
    withAdapter: partial(withAdapter, context),
    withEncryption: partial(withEncryption, context),
    withSecretsManager: partial(withSecretsManager, context)
  })
}
