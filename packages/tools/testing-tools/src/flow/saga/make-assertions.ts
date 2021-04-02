import partial from 'lodash.partial'
import { OmitFirstArgument, SagaContext, SagaTestResult } from '../../types'
import { shouldExecuteCommand } from './should-execute-command'
import { shouldExecuteQuery } from './should-execute-query'

export type SagaAssertionsNode = {
  shouldExecuteCommand: OmitFirstArgument<typeof shouldExecuteCommand>
  shouldExecuteQuery: OmitFirstArgument<typeof shouldExecuteQuery>
} & Promise<SagaTestResult>

export const makeAssertions = (context: SagaContext): SagaAssertionsNode =>
  Object.assign(context.environment.promise, {
    shouldExecuteCommand: partial(shouldExecuteCommand, context),
    shouldExecuteQuery: partial(shouldExecuteQuery, context),
  })
