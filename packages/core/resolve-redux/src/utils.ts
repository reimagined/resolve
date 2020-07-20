const regExpAbsoluteUrl = /:\/\//i
const regExpLeadingSlash = /^\//i

export const isAbsoluteUrl = (value: string): boolean =>
  regExpAbsoluteUrl.test(value)

export const isLeadingSlash = (value: string): boolean =>
  regExpLeadingSlash.test(value)

export const isString = (value: string): boolean =>
  value != null && value.constructor === String

export const isNonString = (value: string): boolean => !isString(value)
