const validation = {
  stateIsAbsent: (state: any, type: string) => {
    if (Object.keys(state).length > 0) {
      throw new Error(`${type} already exists`)
    }
  },

  fieldRequired: (payload: any, field: string) => {
    if (!payload[field]) {
      throw new Error(`The "${field}" field is required`)
    }
  },

  stateExists: (state: any, type: string) => {
    if (!state || Object.keys(state).length === 0) {
      throw new Error(`${type} does not exist`)
    }
  },

  itemIsNotInArray: (
    array: any[],
    item: any,
    errorMessage = 'Item is already in array'
  ) => {
    if (array.includes(item)) {
      throw new Error(errorMessage)
    }
  },

  itemIsInArray: (
    array: any[],
    item: any,
    errorMessage = 'Item is not in array'
  ) => {
    if (!array.includes(item)) {
      throw new Error(errorMessage)
    }
  },

  keyIsNotInObject: (
    object: any,
    key: string,
    errorMessage = 'Key is already in object'
  ) => {
    if (object[key]) {
      throw new Error(errorMessage)
    }
  },
}

export default validation
