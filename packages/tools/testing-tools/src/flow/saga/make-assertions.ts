import partial from 'lodash.partial'
import { OmitFirstArgument, SagaContext, SagaTestResult } from '../../types'
import { mockCommandImplementation } from './mock-command-implementation'
import { mockQueryImplementation } from './mock-query-implementation'
import { shouldExecuteCommand } from './should-execute-command'
import { shouldExecuteQuery } from './should-execute-query'
import { shouldExecuteSideEffect } from './should-execute-side-effect'

export type SagaAssertionsNode = {
  shouldExecuteCommand: OmitFirstArgument<typeof shouldExecuteCommand>
  shouldExecuteQuery: OmitFirstArgument<typeof shouldExecuteQuery>
  shouldExecuteSideEffect: OmitFirstArgument<typeof shouldExecuteSideEffect>
  mockCommandImplementation: OmitFirstArgument<typeof mockCommandImplementation>
  mockQueryImplementation: OmitFirstArgument<typeof mockQueryImplementation>
} & Promise<SagaTestResult>

export const makeAssertions = (context: SagaContext): SagaAssertionsNode =>
  Object.assign(context.environment.promise, {
    shouldExecuteCommand: partial(shouldExecuteCommand, context),
    shouldExecuteQuery: partial(shouldExecuteQuery, context),
    shouldExecuteSideEffect: partial(shouldExecuteSideEffect, context),
    mockCommandImplementation: partial(mockCommandImplementation, context),
    mockQueryImplementation: partial(mockQueryImplementation, context),
  })
