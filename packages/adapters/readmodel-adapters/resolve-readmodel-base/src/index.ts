import createAdapter from './create-adapter'
import withPerformanceTracer from './with-performance-tracer'
import wrapConnect from './wrap-connect'
import wrapDisconnect from './wrap-disconnect'
import wrapDispose from './wrap-dispose'
import wrapOperation from './wrap-operation'

export default createAdapter.bind(null, {
  withPerformanceTracer,
  wrapConnect,
  wrapDisconnect,
  wrapDispose,
  wrapOperation
})

export const OMIT_BATCH = Symbol('OMIT_BATCH')
export const STOP_BATCH = Symbol('STOP_BATCH')
