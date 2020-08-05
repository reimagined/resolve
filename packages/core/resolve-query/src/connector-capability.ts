export enum ReadModelConnectorCapability {
  None,
  Regular,
  XA
}

export const getConnectorCapability = (
  connector: any
): ReadModelConnectorCapability => {
  if (typeof connector.beginXATransaction === 'function') {
    return ReadModelConnectorCapability.XA
  }
  if (typeof connector.beginTransaction === 'function') {
    return ReadModelConnectorCapability.Regular
  }
  return ReadModelConnectorCapability.None
}
