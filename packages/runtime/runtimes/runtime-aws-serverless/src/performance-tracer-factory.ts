import type { PerformanceTracer } from '@resolve-js/core'

export const performanceTracerFactory = (): PerformanceTracer => {
  let AWSXray: any
  try {
    AWSXray = module['require'].bind(module)('aws-xray-sdk-core')
  } catch {}

  let segment: any = process.env.TRACE ? (AWSXray?.getSegment() ?? null) : null
  let traceId = process.env._X_AMZN_TRACE_ID

  return {
    getSegment: () => {
      if (traceId !== process.env._X_AMZN_TRACE_ID) {
        traceId = process.env._X_AMZN_TRACE_ID
        segment = process.env.TRACE ? (AWSXray?.getSegment() ?? null) : null
      }

      return {
        addNewSubsegment: (subsegmentName: string) => {
          const subsegment = process.env.TRACE
            ? (segment?.addNewSubsegment(subsegmentName) ?? null)
            : null
          const prevSegment = segment
          segment = subsegment

          return {
            addAnnotation: (annotationName: string, data: any) => {
              if (process.env.TRACE) {
                void subsegment?.addAnnotation(
                  annotationName,
                  data != null ? data : '<Empty annotation>'
                )
              }
            },
            addError: (error: any) => {
              if (process.env.TRACE) {
                void subsegment?.addError(error)
              }
            },
            close: () => {
              if (process.env.TRACE) {
                void subsegment?.close()
                segment = prevSegment
              }
            },
          }
        },
      }
    },
  }
}
