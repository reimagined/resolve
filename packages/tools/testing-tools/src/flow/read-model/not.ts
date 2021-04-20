import partial from 'lodash.partial'
import { QueryContext } from '../../types'
import { QueryNode } from './query'
import { shouldReturn } from './should-return'

export type NotNode = Omit<
  QueryNode,
  'not' | 'withSecretsManager' | 'setSecretsManager' | 'as'
>

export const not = (context: QueryContext): NotNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(`Assertion cannot be negated if the test was executed.`)
  }

  if (environment.isAssertionNegated()) {
    throw Error(`Assertion already negated.`)
  }

  environment.negateAssertion()

  return Object.assign(environment.promise, {
    shouldReturn: partial(shouldReturn, context),
  })
}
