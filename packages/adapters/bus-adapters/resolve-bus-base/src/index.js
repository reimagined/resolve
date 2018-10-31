import createAdapter from './create-adapter'
import wrapInit from './wrap-init'
import wrapMethod from './wrap-method'
import subscribe from './subscribe'

export default createAdapter.bind(null, wrapInit, wrapMethod, subscribe)
