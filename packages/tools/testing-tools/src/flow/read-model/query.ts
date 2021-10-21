import { SerializableMap } from '@resolve-js/core'
import partial from 'lodash.partial'
import {
  OmitFirstArgument,
  QueryContext,
  QueryTestResult,
  ReadModelContext,
  TestQuery,
} from '../../types'
import { as } from './as'
import { withSecretsManager } from './with-secrets-manager'
import { makeTestEnvironment } from './make-test-environment'
import { shouldReturn } from './should-return'
import { not } from './not'

export type QueryNode = {
  as: OmitFirstArgument<typeof as>
  withSecretsManager: OmitFirstArgument<typeof withSecretsManager>
  shouldReturn: OmitFirstArgument<typeof shouldReturn>
  not: OmitFirstArgument<typeof not>
} & Promise<QueryTestResult>

export const query = (
  readModelContext: ReadModelContext,
  resolver: string,
  args?: SerializableMap
): QueryNode => {
  const query: TestQuery = {
    resolver,
    args,
  }
  const context: QueryContext = {
    ...readModelContext,
    query,
    environment: makeTestEnvironment({
      ...readModelContext,
      query,
    }),
  }

  return Object.assign(context.environment.promise, {
    as: partial(as, context),
    withSecretsManager: partial(withSecretsManager, context),
    shouldReturn: partial(shouldReturn, context),
    not: partial(not, context),
  })
}
