const sideEffect = async (
  eventProperties,
  sideEffects,
  effectName,
  ...args
) => {
  return await sideEffects[effectName](...args, eventProperties)
}

const wrapSideEffects = (eventProperties, sideEffects) => {
  if (sideEffects == null || sideEffects.constructor !== Object) {
    return {}
  }

  return Object.keys(sideEffects).reduce((acc, effectName) => {
    acc[effectName] = sideEffect.bind(
      null,
      eventProperties,
      sideEffects,
      effectName
    )
    return acc
  }, {})
}

export default wrapSideEffects
