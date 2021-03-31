import { SerializableMap } from '@resolve-js/core'
import partial from 'lodash.partial'
import {
  AggregateContext,
  AggregateTestResult,
  OmitFirstArgument,
} from '../../types'
import { as } from './as'
import { makeTestEnvironment } from './make-test-environment'
import { shouldProduceEvent } from './should-produce-event'
import { shouldThrow } from './should-throw'

export type AssertionsNode = {
  shouldProduceEvent: OmitFirstArgument<typeof shouldProduceEvent>
  shouldThrow: OmitFirstArgument<typeof shouldThrow>
}

type CommandNode = {
  as: OmitFirstArgument<typeof as>
} & AssertionsNode &
  Promise<AggregateTestResult>

export const command = (
  context: AggregateContext,
  name: string,
  payload?: SerializableMap
): CommandNode => {
  const commandContext = {
    ...context,
    command: {
      name,
      payload,
    },
    environment: makeTestEnvironment(context),
  }

  return Object.assign(commandContext.environment.promise, {
    as: partial(as, commandContext),
    shouldProduceEvent: partial(shouldProduceEvent, commandContext),
    shouldThrow: partial(shouldThrow, commandContext),
  })
}
