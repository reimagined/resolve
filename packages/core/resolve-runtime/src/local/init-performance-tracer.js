// TODO

const initPerformanceTracer = resolve => {
  Object.defineProperty(resolve, 'performanceTracer', {
    value: {
      getSegment: () => {
        return {
          addNewSubsegment: subsegmentName => {
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
              }
            }
          }
        }
      }
    }
  })
}

export default initPerformanceTracer
