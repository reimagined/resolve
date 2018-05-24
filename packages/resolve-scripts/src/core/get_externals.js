import getIn from 'lodash/get'

const getExternals = resolveConfig => {
  const externals = []

  for (const key of resolveConfig.meta.file) {
    //TODO
    if (!resolveConfig.meta.external.find(baseKey => key.startsWith(baseKey))) {
      continue
    }

    externals.push(getIn(resolveConfig, key))
  }

  return externals
}

export default getExternals
