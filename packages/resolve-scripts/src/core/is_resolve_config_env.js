const regExp = /^\$ref\/deployOptions\/env\//

const isResolveConfigEnv = value => regExp.test(value)

export default isResolveConfigEnv
