import pureRequire from '../common/utils/pure-require'

const initPerformanceTracer = (resolve) => {
  let AWSXray
  try {
    AWSXray = pureRequire('aws-xray-sdk-core')
  } catch (error) {
    console.log('IMPORT ERROR', error)
  }
  let segment = process.env.TRACE ? AWSXray.getSegment() : null
  let traceId = process.env._X_AMZN_TRACE_ID

  Object.defineProperty(resolve, 'performanceTracer', {
    value: {
      getSegment: () => {
        if (traceId !== process.env._X_AMZN_TRACE_ID) {
          traceId = process.env._X_AMZN_TRACE_ID
          segment = process.env.TRACE ? AWSXray.getSegment() : null
        }

        return {
          addNewSubsegment: (subsegmentName) => {
            const subsegment = process.env.TRACE
              ? segment.addNewSubsegment(subsegmentName)
              : null
            const prevSegment = segment
            segment = subsegment

            return {
              addAnnotation: (annotationName, data) => {
                if (process.env.TRACE) {
                  subsegment.addAnnotation(
                    annotationName,
                    data != null ? data : '<Empty annotation>'
                  )
                }
              },
              addError: (error) => {
                if (process.env.TRACE) {
                  subsegment.addError(error)
                }
              },
              close: () => {
                if (process.env.TRACE) {
                  subsegment.close()
                  segment = prevSegment
                }
              },
            }
          },
        }
      },
    },
  })
}

export default initPerformanceTracer
