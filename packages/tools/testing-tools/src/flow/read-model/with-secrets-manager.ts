import { SecretsManager } from '@resolve-js/core'
import partial from 'lodash.partial'
import { QueryContext } from '../../types'
import { QueryNode } from './query'
import { as } from './as'
import { not } from './not'
import { shouldReturn } from './should-return'

type WithSecretsManagerNode = Omit<
  QueryNode,
  'withSecretsManager' | 'setSecretsManager'
>

export const withSecretsManager = (
  context: QueryContext,
  manager: SecretsManager
): WithSecretsManagerNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Secrets manager cannot be assigned if the test was executed.`)
  }

  environment.setSecretsManager(manager)

  return Object.assign(environment.promise, {
    as: partial(as, context),
    shouldReturn: partial(shouldReturn, context),
    not: partial(not, context),
  })
}
