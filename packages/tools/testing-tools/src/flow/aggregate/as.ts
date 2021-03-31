import partial from 'lodash.partial'
import { AggregateTestResult, CommandContext } from '../../types'
import { AssertionsNode } from './command'
import { shouldProduceEvent } from './should-produce-event'
import { shouldThrow } from './should-throw'

type AsNode = AssertionsNode & Promise<AggregateTestResult>

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
  })
}
