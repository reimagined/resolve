import { checkImportKey } from 'resolve-scripts'

const createReactModule = ({ routes, redux }) => {
  if (routes == null || routes.constructor !== String) {
    throw new Error(
      'Routes should be file path to react-router-static declaration'
    )
  }
  if (redux == null || redux.constructor !== Object) {
    throw new Error(
      'Redux should be object with fields "reducers", "sagas", "middlewares" and "enhancers"'
    )
  }

  const imports = { [routes]: routes }
  if (redux.reducers != null && redux.reducers.constructor === Object) {
    for (const key of Object.keys(redux.reducers)) {
      imports[redux.reducers[key]] = redux.reducers[key]
    }
  }
  if (Array.isArray(redux.sagas)) {
    for (const key of redux.sagas) {
      imports[key] = key
    }
  }
  if (Array.isArray(redux.middlewares)) {
    for (const key of redux.middlewares) {
      imports[key] = key
    }
  }
  if (Array.isArray(redux.enhancers)) {
    for (const key of redux.enhancers) {
      imports[key] = key
    }
  }

  for (const key of Object.keys(imports)) {
    if (checkImportKey(key)) {
      delete imports[key]
    }
  }

  const apiHandlers = [
    {
      method: 'GET',
      path: `/:default*`,
      controller: {
        module:
          'resolve-module-react-router/lib/common/api_handler_constructor',
        options: { routes, redux }
      }
    }
  ]

  const index = {
    module: 'resolve-module-react-router/lib/client/index_constructor',
    options: { routes, redux }
  }

  return {
    clientImports: imports,
    serverImports: imports,
    apiHandlers,
    index
  }
}

export default createReactModule
