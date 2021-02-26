import { ValidateEventFilter } from './types'

const hasType = (type: any, obj: any): boolean =>
  obj != null && obj.constructor === type

const isPositiveIntNumber = (obj: any): boolean => {
  return typeof obj === 'number' && obj > 0 && obj === Math.floor(obj)
}

const validateEventFilter: ValidateEventFilter = (filter: any): void => {
  if (!hasType(Object, filter)) {
    throw new Error('Event filter should be an object')
  }

  const errors: any[] = []
  const stringArrayFields: string[] = ['eventTypes', 'aggregateIds']
  const numericFields: string[] = [
    'startTime',
    'finishTime',
    'limit',
    'eventsSizeLimit',
  ]
  const conflictFields: string[][] = [
    ['startTime', 'cursor'],
    ['finishTime', 'cursor'],
  ]
  const requiredFields: string[] = ['limit']

  for (const key of requiredFields) {
    if (filter[key] == null) {
      errors.push(`Event filter field "${key}" is mandatory`)
    }
  }

  for (const key of Object.keys(filter)) {
    if (
      !stringArrayFields.includes(key) &&
      !numericFields.includes(key) &&
      key !== 'cursor'
    ) {
      errors.push(`Wrong field "${key}" in event filter`)
    } else if (
      numericFields.includes(key) &&
      !isPositiveIntNumber(filter[key])
    ) {
      errors.push(`Event filter field "${key}" should be number`)
    } else if (
      stringArrayFields.includes(key) &&
      !(
        (Array.isArray(filter[key]) &&
          filter[key].every(hasType.bind(null, String))) ||
        filter[key] == null
      )
    ) {
      errors.push(
        `Event filter field "${key}" should be array of strings or be null`
      )
    } else if (
      key === 'cursor' &&
      !(hasType(String, filter[key]) || filter[key] == null)
    ) {
      errors.push(`Event filter field "${key}" should be string or null`)
    }
  }

  for (const [key1, key2] of conflictFields) {
    if (filter[key1] != null && filter[key2] != null) {
      errors.push(`Event filter field "${key1}" conflicts with field "${key2}"`)
    }
  }

  if (filter.startTime !== undefined && filter.finishTime !== undefined) {
    if (filter.startTime > filter.finishTime) {
      errors.push(`Event filter start time can't be larger than finishTime`)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }
}

export default validateEventFilter
