  let currentSagaName: string | null = null
  const sideEffectPropertyName = 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'

  Object.defineProperties(runtime, {
    getSideEffectsTimestamp: {
      get: () => () =>
        executeSagaListener.getProperty({
          eventSubscriber: currentSagaName,
          key: sideEffectPropertyName,
        }),
      enumerable: true,
    },
    setSideEffectsTimestamp: {
      get: () => (sideEffectTimestamp: number) =>
        executeSagaListener.setProperty({
          eventSubscriber: currentSagaName,
          key: sideEffectPropertyName,
          value: sideEffectTimestamp,
        }),
      enumerable: true,
    },
  })

