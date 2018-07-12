const regExp = /^\//i

const isLeadingSlash = value => regExp.test(value)

export default isLeadingSlash
