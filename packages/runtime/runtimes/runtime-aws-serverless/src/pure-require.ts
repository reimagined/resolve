// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'

declare const __non_webpack_require__: Function

let realRequire: Function = require
try {
  realRequire = __non_webpack_require__
} catch {}

const pureRequire = (name: string) => {
  return interopRequireDefault(realRequire(name)).default
}

export default pureRequire
