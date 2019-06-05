// TODO

const initPerformanceTracer = resolve => {
  Object.defineProperty(resolve, 'performanceTracer', {
    value: {
      getSegment: () => {
        let segment = []

        return {
          addNewSubsegment: subsegmentName => {
            const subsegment = []
            segment.push(subsegmentName, subsegment)

            const prevSegment = segment
            segment = subsegment

            return {
              addAnnotation: (annotationName, data) => {
                // eslint-disable-next-line no-console
                console.log(
                  'subsegmentName=',
                  subsegmentName,
                  'addAnnotation',
                  annotationName,
                  data
                )
              },
              addError: error => {
                // eslint-disable-next-line no-console
                console.log(
                  'subsegmentName=',
                  subsegmentName,
                  'addError',
                  error
                )
              },
              close: () => {
                // eslint-disable-next-line no-console
                console.log('subsegmentName=', subsegmentName, 'close')
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
