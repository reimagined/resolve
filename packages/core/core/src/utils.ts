import {
  Monitoring,
  PerformanceSegment,
  PerformanceSubsegment,
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

export function lateBoundProxy<
  TSource extends { [key: string]: any },
  TReference extends keyof TSource
>(source: TSource, ref: TReference): TSource[TReference] {
  const methods = Object.keys(source[ref]) as Array<keyof TReference>
  const descriptors = methods.reduce<any>((proxy, method) => {
    proxy[method] = {
      get: () => source[ref][method],
      enumerable: true,
    }
    return proxy
  }, {})
  return Object.create(Object.prototype, descriptors)
}
