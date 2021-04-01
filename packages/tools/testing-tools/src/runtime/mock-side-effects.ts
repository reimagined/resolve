import { SideEffectsCollection } from '@resolve-js/core'
import { SagaTestResult } from '../types'

export const mockSideEffects = (
  buffer: SagaTestResult,
  sideEffects: SideEffectsCollection
) => {
  return Object.keys(sideEffects).reduce<SideEffectsCollection>(
    (mock, name) => {
      mock[name] = async (...args: any[]) => buffer.sideEffects.push(args)
      return mock
    },
    {}
  )
}
