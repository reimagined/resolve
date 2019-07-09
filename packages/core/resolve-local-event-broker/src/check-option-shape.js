const checkOptionShape = (option, types, nullable = false) =>
  (nullable && option == null) ||
  !(
    option == null ||
    !types.reduce((acc, type) => acc || option.constructor === type, false)
  )

export default checkOptionShape
