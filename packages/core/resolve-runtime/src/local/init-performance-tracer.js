const initPerformanceTracer = resolve => {
  Object.defineProperty(resolve, 'performanceTracer', {
    value: {
      getSegment: () => {
        return {
          addNewSubsegment: subsegmentName => {
            return {
              addAnnotation: (annotationName, data) => {
                console.log(
                  'subsegmentName=',
                  subsegmentName,
                  'addAnnotation',
                  annotationName,
                  data
                )
              },
              addError: error => {
                console.log(
                  'subsegmentName=',
                  subsegmentName,
                  'addError',
                  error
                )
              },
              close: () => {
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
