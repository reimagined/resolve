import partial from 'lodash.partial'
import { QueryContext } from '../../types'
import { QueryNode } from './query'
import { withSecretsManager } from './with-secrets-manager'
import { shouldReturn } from './should-return'
import { not } from './not'

export type AsNode = Omit<QueryNode, 'as'>

export const as = (context: QueryContext, authToken: string): AsNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(
      `Authorization token cannot be assigned if the test was executed.`
    )
  }

  environment.setAuthToken(authToken)

  return Object.assign(environment.promise, {
    withSecretsManager: partial(withSecretsManager, context),
    shouldReturn: partial(shouldReturn, context),
    not: partial(not, context),
  })
}
