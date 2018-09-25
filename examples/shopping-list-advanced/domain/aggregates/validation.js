export default {
  stateIsAbsent: (state, type) => {
    if (Object.keys(state).length > 0) {
      throw new Error(`${type} already exists`)
    }
  },

  fieldRequired: (payload, field) => {
    if (!payload[field]) {
      throw new Error(`The "${field}" field is required`)
    }
  },

  toEqual: (obj, key, value) => {
    if (obj[key] !== value) {
      throw new Error(`The ".${key}" must be a equal to "${value}"`)
    }
  },

  stateExists: (state, type) => {
    if (!state || Object.keys(state).length === 0) {
      throw new Error(`${type} does not exist`)
    }
  },

  itemIsNotInArray: (
    array,
    item,
    errorMessage = 'Item is already in array'
  ) => {
    if (array.includes(item)) {
      throw new Error(errorMessage)
    }
  },

  itemIsInArray: (array, item, errorMessage = 'Item is not in array') => {
    if (!array.includes(item)) {
      throw new Error(errorMessage)
    }
  },

  keyIsNotInObject: (
    object,
    key,
    errorMessage = 'Key is already in object'
  ) => {
    if (object[key]) {
      throw new Error(errorMessage)
    }
  }
}
