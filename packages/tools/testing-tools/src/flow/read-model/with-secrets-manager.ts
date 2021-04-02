import { SecretsManager } from '@resolve-js/core'
import partial from 'lodash.partial'
import { QueryContext } from '../../types'
import { QueryNode } from './query'
import { as } from './as'
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
  })
}

// FIXME: deprecated
export const setSecretsManager = (
  context: QueryContext,
  manager: SecretsManager
) => {
  // eslint-disable-next-line no-console
  console.warn(
    `'setSecretsManager' deprecated, you should use withSecretsManager instead`
  )
  return withSecretsManager(context, manager)
}
