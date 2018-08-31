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

  stateExists: (state, type) => {
    if (!state || Object.keys(state).length === 0) {
      throw new Error(`${type} does not exist`)
    }
  }
}
