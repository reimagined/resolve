const coercer = ({
  intValue,
  stringValue,
  bigIntValue,
  longValue,
  booleanValue,
  isNull,
  ...rest
}) => {
  if (intValue != null) {
    return Number(intValue)
  } else if (bigIntValue != null) {
    return Number(bigIntValue)
  } else if (longValue != null) {
    return Number(longValue)
  } else if (stringValue != null) {
    return String(stringValue)
  } else if (booleanValue != null) {
    return Boolean(booleanValue)
  } else if (isNull === true) {
    return null
  } else {
    throw new Error(`Unknown type ${JSON.stringify(rest)}`)
  }
}

export default coercer
