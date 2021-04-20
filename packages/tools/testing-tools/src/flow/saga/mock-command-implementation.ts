import { MockedCommandImplementation, SagaContext } from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'

export const mockCommandImplementation = (
  context: SagaContext,
  aggregateName: string,
  type: string,
  implementation: MockedCommandImplementation
): SagaAssertionsNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(
      `Command implementation cannot be mocked if the test was executed.`
    )
  }

  environment.mockCommandImplementation(aggregateName, type, implementation)

  return makeAssertions(context)
}
