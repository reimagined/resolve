import { MockedQueryImplementation, SagaContext } from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'

export const mockQueryImplementation = (
  context: SagaContext,
  modelName: string,
  resolverName: string,
  implementation: MockedQueryImplementation
): SagaAssertionsNode => {
  const { environment } = context

  if (environment.isExecuted()) {
    throw Error(
      `Query implementation cannot be mocked if the test was executed.`
    )
  }

  environment.mockQueryImplementation(modelName, resolverName, implementation)

  return makeAssertions(context)
}
