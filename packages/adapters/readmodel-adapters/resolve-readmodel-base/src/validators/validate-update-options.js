const validateUpdateOptions = (options, errors) => {
  if (options != null && options.constructor !== Object) {
    errors.push(`Update options should be null or object`)
  } else if (options != null) {
    const updateKeys = Object.keys(options)
    if (updateKeys.length !== 1 || updateKeys[0] !== 'upsert') {
      errors.push(`Update options supports only "upsert" flag`)
    } else if (
      options.upsert == null ||
      options.upsert.constructor !== Boolean
    ) {
      errors.push(`Update "upsert" flag should be true or false`)
    }
  }
}

export default validateUpdateOptions
