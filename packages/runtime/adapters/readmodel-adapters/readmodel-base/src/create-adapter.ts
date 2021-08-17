//eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import PathToolkit from 'path-toolkit'
import { checkEventsContinuity } from '@resolve-js/eventstore-base'

import _createAdapter from './create-adapter-factory'
import makeSplitNestedPath from './make-split-nested-path'
import eventstoreOperationTimeLimited from './eventstore-operation-time-limited'
import withPerformanceTracer from './with-performance-tracer'
import wrapWithCloneArgs from './wrap-with-clone-args'
import wrapConnect from './wrap-connect'
import wrapDisconnect from './wrap-disconnect'
import wrapDispose from './wrap-dispose'
import wrapOperation from './wrap-operation'
import { CreateAdapterMethod } from './types'

const baseAdapterImports = {
  splitNestedPath: makeSplitNestedPath(PathToolkit),
  eventstoreOperationTimeLimited,
  checkEventsContinuity,
  makeSplitNestedPath,
  withPerformanceTracer,
  wrapWithCloneArgs,
  wrapConnect,
  wrapDisconnect,
  wrapDispose,
  wrapOperation,
}

const createAdapter = _createAdapter.bind(
  null,
  baseAdapterImports
) as CreateAdapterMethod

export default createAdapter
