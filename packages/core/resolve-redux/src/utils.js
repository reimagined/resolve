const regExpAbsoluteUrl = /:\/\//i
const regExpLeadingSlash = /^\//i

export const isAbsoluteUrl = value => regExpAbsoluteUrl.test(value)

export const isLeadingSlash = value => regExpLeadingSlash.test(value)

export const isString = value => value != null && value.constructor === String

export const isNonString = value => !isString(value)
