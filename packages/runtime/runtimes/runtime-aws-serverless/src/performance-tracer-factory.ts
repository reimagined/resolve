import AWSXray from 'aws-xray-sdk-core'
import type { PerformanceTracer } from '@resolve-js/core'

export const performanceTracerFactory = (): PerformanceTracer => {
  let segment = process.env.TRACE ? AWSXray.getSegment() : null
  let traceId = process.env._X_AMZN_TRACE_ID

  return {
    getSegment: () => {
      if (traceId !== process.env._X_AMZN_TRACE_ID) {
        traceId = process.env._X_AMZN_TRACE_ID
        segment = process.env.TRACE ? AWSXray.getSegment() : null
      }

      return {
        addNewSubsegment: (subsegmentName: string) => {
          const subsegment = process.env.TRACE
            ? (segment as AWSXray.Segment).addNewSubsegment(subsegmentName)
            : null
          const prevSegment = segment
          segment = subsegment

          return {
            addAnnotation: (annotationName: string, data: any) => {
              if (process.env.TRACE) {
                void (subsegment as AWSXray.Subsegment).addAnnotation(
                  annotationName,
                  data != null ? data : '<Empty annotation>'
                )
              }
            },
            addError: (error: any) => {
              if (process.env.TRACE) {
                void (subsegment as AWSXray.Subsegment).addError(error)
              }
            },
            close: () => {
              if (process.env.TRACE) {
                void (subsegment as AWSXray.Subsegment).close()
                segment = prevSegment
              }
            },
          }
        },
      }
    },
  }
}
