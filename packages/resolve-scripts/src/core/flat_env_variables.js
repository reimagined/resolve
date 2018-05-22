const flatEnvVariables = json => {
  for (const key of Array.isArray(json) ? json : Object.keys(json)) {
    if (
      json[key] &&
      json[key].type === 'env' &&
      json[key].name.constructor === String &&
      json[key].ref.constructor === String
    ) {
      json[key] = json[key].ref
    } else if (typeof json[key] === 'object') {
      flatEnvVariables(json[key])
    }
  }
}

export default flatEnvVariables
