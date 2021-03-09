import {
  Monitoring,
  PerformanceSubsegment,
  PerformanceSegment,
} from './types/runtime'

const addSubSegment = (
  segment: PerformanceSegment | undefined,
  name: string,
  annotations: { [key: string]: string } = {}
) => {
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

export const getPerformanceTracerSubsegment = (
  monitoring: Monitoring | undefined,
  name: string,
  annotations: { [key: string]: string } = {}
): PerformanceSubsegment =>
  addSubSegment(monitoring?.performance?.getSegment(), name, annotations)

export const getPerformanceTracerSegment = (
  monitoring: Monitoring | undefined
): PerformanceSegment => {
  const segment = monitoring?.performance?.getSegment()
  return (
    segment ?? {
      addNewSubsegment: (name: string) => addSubSegment(segment, name),
    }
  )
}
