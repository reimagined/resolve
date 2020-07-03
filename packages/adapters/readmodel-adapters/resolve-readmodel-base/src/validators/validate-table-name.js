const validateTableName = (name, errors) => {
  if(name == null || name.constructor !== String) {
    errors.push(`Table name should be string`)
  } else {
    if(/^__(?:.*?)__$/.test(name)) {
      errors.push(`Table name should not begins and ends with double underscore`)

    }
  }

}

export default validateTableName
