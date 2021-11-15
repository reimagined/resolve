import { SecretsManager } from '@resolve-js/core'
import partial from 'lodash.partial'
import { CommandContext } from '../../types'
import { CommandNode } from './command'
import { shouldProduceEvent } from './should-produce-event'
import { shouldThrow } from './should-throw'
import { as } from './as'

type WithSecretsManagerNode = Omit<
  CommandNode,
  'withSecretsManager' | 'setSecretsManager'
>

export const withSecretsManager = (
  context: CommandContext,
  manager: SecretsManager
): WithSecretsManagerNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Secrets manager cannot be assigned if the test was executed.`)
  }

  environment.setSecretsManager(manager)

  return Object.assign(environment.promise, {
    shouldProduceEvent: partial(shouldProduceEvent, context),
    shouldThrow: partial(shouldThrow, context),
    as: partial(as, context),
  })
}
