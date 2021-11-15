import partial from 'lodash.partial'
import { CommandContext } from '../../types'
import { CommandNode } from './command'
import { shouldProduceEvent } from './should-produce-event'
import { shouldThrow } from './should-throw'
import { withSecretsManager } from './with-secrets-manager'

export type AsNode = Omit<CommandNode, 'as'>

export const as = (context: CommandContext, authToken: string): AsNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(
      `Authorization token cannot be assigned if the test was executed.`
    )
  }

  environment.setAuthToken(authToken)

  return Object.assign(environment.promise, {
    shouldProduceEvent: partial(shouldProduceEvent, context),
    shouldThrow: partial(shouldThrow, context),
    withSecretsManager: partial(withSecretsManager, context),
  })
}
