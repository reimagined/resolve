import crypto from 'crypto'
import debugLevels from '@resolve-js/debug-levels'
import type {
  PerformanceSegment,
  PerformanceSubsegment,
  PerformanceTracer,
} from '@resolve-js/core'

import type { ResolvePartial } from '../common/types'

const log = debugLevels('resolve-performance-tracer')

type Segment = {
  trace_id: null | string | undefined
  id: null | string
  name: null | string
  start_time: number
  end_time: null | number
  delta_time: null | number
  annotations: Record<string, any>
  error: null | string
  errors: any[]
  subsegments: any[]
}

const createEmptySegment = () => {
  const segment: Segment = {
    trace_id: null,
    id: null,
    name: null,
    start_time: 0,
    end_time: null,
    delta_time: null,
    annotations: {},
    error: null,
    errors: [],
    subsegments: [],
  }

  return segment
}

const initPerformanceTracer = (resolve: ResolvePartial): void => {
  let segment = createEmptySegment()
  let traceId = process.env.RESOLVE_LOCAL_TRACE_ID
  segment.trace_id = traceId

  const performanceTracer: PerformanceTracer = {
    getSegment: (): PerformanceSegment => {
      if (traceId !== process.env.RESOLVE_LOCAL_TRACE_ID) {
        segment = createEmptySegment()
        traceId = process.env.RESOLVE_LOCAL_TRACE_ID
        segment.trace_id = traceId
      }

      return {
        addNewSubsegment: (subsegmentName: string) => {
          const subsegment = createEmptySegment()
          segment.subsegments.push(subsegment)

          subsegment.id = crypto
            .randomBytes(Math.ceil(16 / 2))
            .toString('hex')
            .slice(0, 16)
          subsegment.name = subsegmentName
          subsegment.start_time = Date.now()

          const prevSegment = segment
          segment = subsegment

          const result: PerformanceSubsegment = {
            addAnnotation: (annotationName: string, data: any) => {
              subsegment.annotations[annotationName] = data
            },
            addError: (error: any) => {
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
              }

              const subsegmentToPrint: any = {
                name: subsegment.name,
                trace_id: subsegment.trace_id,
                id: subsegment.id,
                start_time: subsegment.start_time,
                end_time: subsegment.end_time,
                delta_time: subsegment.delta_time,
                errors: subsegment.error,
              }
              if (subsegment.subsegments && subsegment.subsegments.length > 0) {
                subsegmentToPrint.subsegments = subsegment.subsegments
              }
              if (process.env.DEBUG) {
                log.verbose(JSON.stringify(subsegmentToPrint, null, 2))
              }
              segment = prevSegment
            },
          }
          return result
        },
      }
    },
  }
  Object.defineProperty(resolve, 'performanceTracer', {
    value: performanceTracer,
  })
}

export default initPerformanceTracer
