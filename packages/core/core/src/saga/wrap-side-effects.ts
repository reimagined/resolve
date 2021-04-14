import { SideEffectsCollection } from '../types/core'
import { SideEffectsContext } from './types'

const sideEffect = async (
  callback: Function,
  isEnabled: boolean,
  sideEffectsContext: SideEffectsContext,
  ...args: any[]
) => {
  if (isEnabled) {
    return await callback(...args, sideEffectsContext)
  } else {
    // Explicitly return undefined for disabled side-effects
    return undefined
  }
}

export const wrapSideEffects = (
  sideEffects: SideEffectsCollection,
  isEnabled: boolean,
  sideEffectsContext: SideEffectsContext
) => {
  return Object.keys(sideEffects).reduce<SideEffectsCollection>(
    (acc, effectName) => {
      const effectOrSubCollection = sideEffects[effectName]
      if (typeof effectOrSubCollection === 'function') {
        acc[effectName] = sideEffect.bind(
          null,
          effectOrSubCollection,
          isEnabled,
          sideEffectsContext
        )
      }
      if (
        typeof effectOrSubCollection === 'object' &&
        effectOrSubCollection !== null
      ) {
        acc[effectName] = wrapSideEffects(
          effectOrSubCollection,
          isEnabled,
          sideEffectsContext
        )
      }
      return acc
    },
    {}
  )
}
