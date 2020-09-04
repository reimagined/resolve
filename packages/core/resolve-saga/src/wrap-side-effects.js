const sideEffect = async (
  eventProperties,
  sideEffects,
  effectName,
  isEnabled,
  ...args
) => {
  if (isEnabled) {
    return await sideEffects[effectName](...args, eventProperties);
  } else {
    // Explicitly return undefined for disabled side-effects
    return undefined;
  }
};

const wrapSideEffects = (eventProperties, sideEffects, isEnabled) => {
  return Object.keys(sideEffects).reduce((acc, effectName) => {
    if (typeof sideEffects[effectName] === 'function') {
      acc[effectName] = sideEffect.bind(
        null,
        eventProperties,
        sideEffects,
        effectName,
        isEnabled
      );
    }
    if (
      typeof sideEffects[effectName] === 'object' &&
      sideEffects[effectName] !== null
    ) {
      acc[effectName] = wrapSideEffects(
        eventProperties,
        sideEffects[effectName],
        isEnabled
      );
    }
    return acc;
  }, {});
};

export default wrapSideEffects;
