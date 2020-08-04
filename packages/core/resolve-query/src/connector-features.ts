const functionsProvided = (...functions: any[]) =>
  functions.findIndex(f => !f || typeof f !== 'function') === -1

export enum ReadModelConnectorFeatures {
  None = 0,
  Basic = 1 << 0,
  XA = 1 << 1,
  All = ~(~0 << 3)
}

export const detectConnectorFeatures = (
  connector: any
): ReadModelConnectorFeatures => {
  let features: ReadModelConnectorFeatures = ReadModelConnectorFeatures.None

  if (
    functionsProvided(
      connector.beginTransaction,
      connector.commitTransaction,
      connector.rollbackTransaction
    )
  ) {
    features |= ReadModelConnectorFeatures.Basic
  }

  if (
    functionsProvided(
      connector.beginXATransaction,
      connector.commitXATransaction,
      connector.rollbackXATransaction,
      connector.beginEvent,
      connector.commitEvent,
      connector.rollbackEvent
    )
  ) {
    features |= ReadModelConnectorFeatures.XA
  }

  return features
}
