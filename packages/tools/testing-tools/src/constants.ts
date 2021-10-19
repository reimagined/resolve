export const testContext = Symbol()
export const reservedEventOrderField = '__test__event__order__'
export const ambiguousEventsTimeErrorMessage =
  'The givenEvents function requires either all or none event timestamps to be specified.'
export const getReservedFieldUsedErrorMessage = (field: string) =>
  `"${field}" field is reserved for test runtime.`
