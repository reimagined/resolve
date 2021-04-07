import { SideEffectsCollection } from '@resolve-js/core'
import { SagaTestResult } from '../types'

export const mockSideEffects = (
  buffer: SagaTestResult,
  sideEffects: SideEffectsCollection
) => {
  if (sideEffects != null) {
    return Object.keys(sideEffects).reduce<SideEffectsCollection>(
      (mock, name) => {
        mock[name] = async (...args: any[]) => {
          args.pop() // remove context provided by saga
          buffer.sideEffects.push([name, ...args])
        }
        return mock
      },
      {}
    )
  }
  return null
}
