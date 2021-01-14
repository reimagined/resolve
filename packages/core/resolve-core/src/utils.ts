import { Monitoring, PerformanceSubsegment } from './read-model/types'

export const getPerformanceTracerSubsegment = (
  monitoring: Monitoring | undefined,
  name: string,
  annotations: { [key: string]: string } = {}
): PerformanceSubsegment => {
  const segment = monitoring?.performance?.getSegment()
  const subSegment = segment?.addNewSubsegment(name) ?? {
    addAnnotation: () => {
      /*no-op*/
    },
    addError: () => {
      /*no-op*/
    },
    close: () => {
      /*no-op*/
    },
  }

  Object.keys(annotations).map((name) =>
    subSegment.addAnnotation(name, annotations[name])
  )

  return subSegment
}
