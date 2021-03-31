import partial from 'lodash.partial'
import { QueryContext } from '../../types'
import { QueryNode } from './query'
import { withSecretsManager, setSecretsManager } from './with-secrets-manager'

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
    setSecretsManager: partial(setSecretsManager, context),
  })
}
