import deepmerge from 'deepmerge'

const merge = (...configs) =>
  deepmerge.all(configs, {
    isMergeableObject: obj => {
      if (
        obj != null &&
        obj.hasOwnProperty('module') &&
        obj.hasOwnProperty('options')
      ) {
        return false
      }
      if (Array.isArray(obj)) {
        return true
      }
      if (obj != null && obj.constructor === Object) {
        return true
      }
      return false
    }
  })

export default merge
