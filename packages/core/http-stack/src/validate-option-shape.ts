const validateOptionShape = (
  fieldName: string,
  option: any,
  types: Array<any>,
  nullable = false
) => {
  const isValidValue =
    (nullable && option == null) ||
    !(
      option == null ||
      !types.reduce(
        (acc: boolean, type: any) => acc || option.constructor === type,
        false
      )
    )
  if (!isValidValue) {
    throw new Error(
      `Variable "${fieldName}" should be one of following types: ${types
        .map((item) => (item === Buffer ? 'Buffer' : `${item}`))
        .join(', ')}. Received option: ${option}`
    )
  }
}

export default validateOptionShape
