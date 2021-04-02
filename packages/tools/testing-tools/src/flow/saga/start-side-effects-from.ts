import partial from 'lodash.partial'
import { SagaContext } from '../../types'
import { SagaNode } from './saga'
import { withAdapter } from './with-adapter'
import { withEncryption } from './with-encryption'
import { allowSideEffects } from './allow-side-effects'
import { withSecretsManager } from './with-secrets-manager'
import { makeAssertions } from './make-assertions'

type StartSideEffectsFromNode = Omit<SagaNode, 'startSideEffectsFrom'>

export const startSideEffectsFrom = (
  context: SagaContext,
  date: Date | number | string
): StartSideEffectsFromNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(
      `Side effects start time cannot be assigned if the test was executed.`
    )
  }

  if (date instanceof Date) {
    environment.setSideEffectsStartTimestamp(date.getTime())
  } else if (typeof date === 'string') {
    environment.setSideEffectsStartTimestamp(Date.parse(date))
  } else {
    environment.setSideEffectsStartTimestamp(date)
  }

  return Object.assign(makeAssertions(context), {
    withAdapter: partial(withAdapter, context),
    withEncryption: partial(withEncryption, context),
    allowSideEffects: partial(allowSideEffects, context),
    withSecretsManager: partial(withSecretsManager, context),
  })
}
