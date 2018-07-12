const regExp = /:\/\//i

const isAbsoluteUrl = value => regExp.test(value)

export default isAbsoluteUrl
