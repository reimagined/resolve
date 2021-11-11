import type {
  ObjectFixedUnionToIntersectionByKeys,
  WrapIsConditionUnsupportedFormatMethod,
  ObjectFixedKeys,
  SearchCondition,
  FunctionLike,
} from './types'

export const isConditionUnsupportedFormat = (
  condition: SearchCondition
): boolean => {
  if (condition == null || condition.constructor !== Object) {
    return true
  }
  const conditionKeys = (Object.keys(condition) as unknown) as Array<
    ObjectFixedKeys<SearchCondition>
  >
  const operatorKeys = conditionKeys.filter((key) => key.startsWith('$'))
  if (
    (operatorKeys.length === 1 && conditionKeys.length !== 1) ||
    operatorKeys.length > 1
  ) {
    return true
  }

  let isUnsupported = false
  for (const key of conditionKeys) {
    const currentValue = (condition as ObjectFixedUnionToIntersectionByKeys<
      typeof condition,
      typeof key
    >)[key]
    if (Array.isArray(currentValue)) {
      isUnsupported =
        isUnsupported ||
        currentValue.reduce(
          (acc: boolean, val: SearchCondition) =>
            acc || isConditionUnsupportedFormat(val),
          false
        )
    } else if (currentValue != null && currentValue.constructor === Object) {
      isUnsupported =
        isUnsupported || isConditionUnsupportedFormat(currentValue)
    }
  }

  return isUnsupported
}

const wrapIsConditionUnsupportedFormat: WrapIsConditionUnsupportedFormatMethod = <
  T extends FunctionLike
>(
  fn: T
): T =>
  (((
    ...[tableName, searchCondition, ...args]: Parameters<T>
  ): ReturnType<T> => {
    if (isConditionUnsupportedFormat(searchCondition)) {
      throw new Error(
        `Unsupported search condition format ${JSON.stringify(searchCondition)}`
      )
    }
    return fn(tableName, searchCondition, ...args)
  }) as unknown) as T

export default wrapIsConditionUnsupportedFormat
