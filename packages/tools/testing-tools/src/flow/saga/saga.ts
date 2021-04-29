import partial from 'lodash.partial'
import {
  TestSaga,
  GivenEventsContext,
  OmitFirstArgument,
  SagaContext,
} from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'
import { withAdapter } from './with-adapter'
import { withEncryption } from './with-encryption'
import { withSecretsManager } from './with-secrets-manager'
import { allowSideEffects } from './allow-side-effects'
import { startSideEffectsFrom } from './start-side-effects-from'
import { makeTestEnvironment } from './make-test-environment'

export type SagaNode = {
  withAdapter: OmitFirstArgument<typeof withAdapter>
  withEncryption: OmitFirstArgument<typeof withEncryption>
  withSecretsManager: OmitFirstArgument<typeof withSecretsManager>
  allowSideEffects: OmitFirstArgument<typeof allowSideEffects>
  startSideEffectsFrom: OmitFirstArgument<typeof startSideEffectsFrom>
} & SagaAssertionsNode

export const saga = (
  givenEventsContext: GivenEventsContext,
  saga: TestSaga
): SagaNode => {
  const context: SagaContext = {
    ...givenEventsContext,
    saga,
    environment: makeTestEnvironment({
      ...givenEventsContext,
      saga,
    }),
  }

  return Object.assign(makeAssertions(context), {
    withAdapter: partial(withAdapter, context),
    withEncryption: partial(withEncryption, context),
    withSecretsManager: partial(withSecretsManager, context),
    allowSideEffects: partial(allowSideEffects, context),
    startSideEffectsFrom: partial(startSideEffectsFrom, context),
  })
}
