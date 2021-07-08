import type {
  WithPerformanceTracerMethod,
  CommonAdapterPool,
  BaseAdapterPool,
  FunctionLike,
  UnPromise,
} from './types'

const withPerformanceTracerImpl = async <
  AdapterPool extends CommonAdapterPool,
  MethodImpl extends FunctionLike
>(
  pool: BaseAdapterPool<AdapterPool>,
  methodName: string,
  methodImpl: MethodImpl,
  ...args: Parameters<MethodImpl>
): Promise<UnPromise<ReturnType<MethodImpl>>> => {
  const segment =
    pool.performanceTracer != null ? pool.performanceTracer.getSegment() : null
  const subSegment = segment ? segment.addNewSubsegment(methodName) : null
  const maybeReadModelName: string | null =
    args.length > 1 && args[1] != null && args[1].constructor === String
      ? String(args[1])
      : args.length === 1 && args[0] != null && args[0].constructor === String
      ? String(args[0])
      : null

  if (subSegment != null) {
    if (maybeReadModelName != null) {
      subSegment.addAnnotation('readModelName', maybeReadModelName)
    }
    subSegment.addAnnotation('origin', `resolve:readmodel:${methodName}`)
  }

  const groupMonitoring =
    pool.monitoring != null && maybeReadModelName != null
      ? pool.monitoring
          .group({ Part: 'ReadModel' })
          .group({ ReadModel: maybeReadModelName })
      : null

  const label = `Operation "${methodName}"`
  groupMonitoring?.time(label)

  try {
    return await methodImpl(...args)
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    groupMonitoring?.timeEnd(label)

    if (subSegment != null) {
      subSegment.close()
    }
  }
}

const withPerformanceTracer: WithPerformanceTracerMethod = <
  AdapterPool extends CommonAdapterPool,
  MethodImpl extends FunctionLike
>(
  pool: BaseAdapterPool<AdapterPool>,
  methodName: string,
  methodImpl: MethodImpl
): MethodImpl => {
  return withPerformanceTracerImpl.bind<
    null,
    BaseAdapterPool<CommonAdapterPool>,
    string,
    MethodImpl,
    Parameters<MethodImpl>,
    Promise<UnPromise<ReturnType<MethodImpl>>>
  >(null, pool, methodName, methodImpl) as MethodImpl
}

export default withPerformanceTracer
