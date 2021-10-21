import { SerializableMap } from '@resolve-js/core'
import partial from 'lodash.partial'
import {
  AggregateContext,
  CommandTestResult,
  OmitFirstArgument,
  TestCommand,
} from '../../types'
import { as } from './as'
import { makeTestEnvironment } from './make-test-environment'
import { shouldProduceEvent } from './should-produce-event'
import { shouldThrow } from './should-throw'
import { withSecretsManager } from './with-secrets-manager'

export type AssertionsNode = {
  shouldProduceEvent: OmitFirstArgument<typeof shouldProduceEvent>
  shouldThrow: OmitFirstArgument<typeof shouldThrow>
}

export type CommandNode = {
  as: OmitFirstArgument<typeof as>
  withSecretsManager: OmitFirstArgument<typeof withSecretsManager>
} & AssertionsNode &
  Promise<CommandTestResult>

export const command = (
  context: AggregateContext,
  name: string,
  payload?: SerializableMap
): CommandNode => {
  const command: TestCommand = {
    name,
    payload,
  }
  const commandContext = {
    ...context,
    command,
    environment: makeTestEnvironment({
      ...context,
      command,
    }),
  }

  return Object.assign(commandContext.environment.promise, {
    as: partial(as, commandContext),
    withSecretsManager: partial(withSecretsManager, commandContext),
    shouldProduceEvent: partial(shouldProduceEvent, commandContext),
    shouldThrow: partial(shouldThrow, commandContext),
  })
}
