import { SideEffectsCollection } from './types'

const sideEffect = async (
  callback: Function,
  isEnabled: boolean,
  ...args: any[]
) => {
  if (isEnabled) {
    return await callback(...args)
  } else {
    // Explicitly return undefined for disabled side-effects
    return undefined
  }
}

export const wrapSideEffects = (
  sideEffects: SideEffectsCollection,
  isEnabled: boolean
) => {
  return Object.keys(sideEffects).reduce<SideEffectsCollection>(
    (acc, effectName) => {
      const effectOrSubCollection = sideEffects[effectName]
      if (typeof effectOrSubCollection === 'function') {
        acc[effectName] = sideEffect.bind(
          null,
          effectOrSubCollection,
          isEnabled
        )
      }
      if (
        typeof effectOrSubCollection === 'object' &&
        effectOrSubCollection !== null
      ) {
        acc[effectName] = wrapSideEffects(effectOrSubCollection, isEnabled)
      }
      return acc
    },
    {}
  )
}
