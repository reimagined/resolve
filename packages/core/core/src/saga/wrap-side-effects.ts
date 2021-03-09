import { SagaProperties, SideEffectsCollection } from './types'

const sideEffect = async (
  sagaProperties: SagaProperties,
  callback: Function,
  isEnabled: boolean,
  ...args: any[]
) => {
  if (isEnabled) {
    return await callback(...args, sagaProperties)
  } else {
    // Explicitly return undefined for disabled side-effects
    return undefined
  }
}

export const wrapSideEffects = (
  sagaProperties: SagaProperties,
  sideEffects: SideEffectsCollection,
  isEnabled: boolean
) => {
  return Object.keys(sideEffects).reduce<SideEffectsCollection>(
    (acc, effectName) => {
      const effectOrSubCollection = sideEffects[effectName]
      if (typeof effectOrSubCollection === 'function') {
        acc[effectName] = sideEffect.bind(
          null,
          sagaProperties,
          effectOrSubCollection,
          isEnabled
        )
      }
      if (
        typeof effectOrSubCollection === 'object' &&
        effectOrSubCollection !== null
      ) {
        acc[effectName] = wrapSideEffects(
          sagaProperties,
          effectOrSubCollection,
          isEnabled
        )
      }
      return acc
    },
    {}
  )
}
