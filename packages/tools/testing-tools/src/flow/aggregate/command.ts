import { SerializableMap } from '@resolve-js/core'
import partial from 'lodash.partial'
import {
  AggregateContext,
  AggregateTestResult,
  OmitFirstArgument,
} from '../../types'
import { as } from './as'
import { makeTestEnvironment } from './make-test-environment'

type CommandNode = {
  as: OmitFirstArgument<typeof as>
} & PromiseLike<AggregateTestResult>

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
    environment: makeTestEnvironment({}),
  }

  return Object.assign(commandContext.environment.promise, {
    as: partial(as, commandContext),
  })
}
