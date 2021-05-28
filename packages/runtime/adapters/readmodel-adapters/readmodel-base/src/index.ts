//eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import PathToolkit from 'path-toolkit'

import _createAdapter from './create-adapter'
import makeSplitNestedPath from './make-split-nested-path'
import withPerformanceTracer from './with-performance-tracer'
import wrapConnect from './wrap-connect'
import wrapDisconnect from './wrap-disconnect'
import wrapDispose from './wrap-dispose'
import wrapOperation from './wrap-operation'
import { CreateAdapterMethod } from './types'
export * from './types'

const createAdapter = _createAdapter.bind(null, {
  PathToolkit,
  makeSplitNestedPath,
  withPerformanceTracer,
  wrapConnect,
  wrapDisconnect,
  wrapDispose,
  wrapOperation,
}) as CreateAdapterMethod

export default createAdapter
