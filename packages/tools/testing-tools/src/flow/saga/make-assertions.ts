import partial from 'lodash.partial'
import { OmitFirstArgument, SagaContext, SagaTestResult } from '../../types'
import { shouldExecuteCommand } from './should-execute-command'

export type SagaAssertionsNode = {
  shouldExecuteCommand: OmitFirstArgument<typeof shouldExecuteCommand>
} & Promise<SagaTestResult>

export const makeAssertions = (context: SagaContext): SagaAssertionsNode =>
  Object.assign(context.environment.promise, {
    shouldExecuteCommand: partial(shouldExecuteCommand, context),
  })
