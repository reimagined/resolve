import { SagaContext } from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'

export const mockQueryImplementation = (
  context: SagaContext,
  implementaiton: Function
): SagaAssertionsNode => {
  return makeAssertions(context)
}
