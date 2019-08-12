import crypto from 'crypto'
import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve-performance-tracer')

const createEmptySegment = () => {
  const segment = {
    trace_id: null,
    id: null,
    name: null,
    start_time: null,
    end_time: null,
    delta_time: null,
    annotations: null,
    error: null,
    subsegments: []
  }

  Object.defineProperty(segment, 'toJSON', {
    value: () => '',
    writable: true,
    enumerable: true,
    configurable: true
  })

  return segment
}

const initPerformanceTracer = resolve => {
  let segment = createEmptySegment()
  let traceId = process.env.RESOLVE_LOCAL_TRACE_ID
  segment.trace_id = traceId

  Object.defineProperty(resolve, 'performanceTracer', {
    value: {
      getSegment: () => {
        if (traceId !== process.env.RESOLVE_LOCAL_TRACE_ID) {
          segment = createEmptySegment()
          traceId = process.env.RESOLVE_LOCAL_TRACE_ID
          segment.trace_id = traceId
        }

        return {
          addNewSubsegment: subsegmentName => {
            const subsegment = createEmptySegment()
            segment.subsegments.push(subsegment)

            subsegment.id = crypto
              .randomBytes(Math.ceil(16 / 2))
              .toString('hex')
              .slice(0, 16)
            subsegment.name = subsegmentName
            subsegment.start_time = Date.now()
            subsegment.annotations = {}
            subsegment.errors = []

            const prevSegment = segment
            segment = subsegment

            return {
              addAnnotation: (annotationName, data) => {
                subsegment.annotations[annotationName] = data
              },
              addError: error => {
                subsegment.errors.push(
                  `${error.code ? `${error.code}: ` : ''}${error.message || ''}`
                )
              },
              close: () => {
                subsegment.end_time = Date.now()
                subsegment.delta_time =
                  subsegment.end_time - subsegment.start_time
                if (subsegment.errors.length > 0) {
                  subsegment.error = subsegment.errors.join('; ')
                } else {
                  delete subsegment.error
                }
                delete subsegment.errors
                if (subsegment.subsegments.length === 0) {
                  delete subsegment.subsegments
                }
                if (subsegment.trace_id == null) {
                  delete subsegment.trace_id
                }
                delete segment.toJSON

                if (process.env.DEBUG) {
                  log.verbose(JSON.stringify(subsegment, null, 2))
                }
                segment = prevSegment
              }
            }
          }
        }
      }
    }
  })
}

export default initPerformanceTracer
