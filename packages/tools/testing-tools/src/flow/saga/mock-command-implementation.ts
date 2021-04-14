import { SagaContext } from '../../types'
import { makeAssertions, SagaAssertionsNode } from './make-assertions'

export const mockCommandImplementation = (
  context: SagaContext,
  implementation: Function
): SagaAssertionsNode => {
  return makeAssertions(context)
}
