import getRootBasedUrl from '@resolve-js/runtime/lib/common/utils/get-root-based-url.js'
import builtinRoutes from '@resolve-js/runtime/lib/common/defaults/builtin-routes'

const getRoutesManifest = (resolveConfig) => {
  const { staticRoutes, apiHandlers, rootPath } = resolveConfig
  if (staticRoutes == null) {
    return null
  }
  const manifest = []
  for (const routeDeclaration of staticRoutes) {
    const [staticRoute, maybeMappedStaticFile] = Array.isArray(routeDeclaration)
      ? routeDeclaration
      : [routeDeclaration]
    manifest.push([
      getRootBasedUrl(rootPath, staticRoute),
      'GET',
      maybeMappedStaticFile ?? null,
    ])
  }
  for (const { path, method } of [...builtinRoutes, ...apiHandlers]) {
    manifest.push([getRootBasedUrl(rootPath, path), method])
  }

  return manifest
}

export default getRoutesManifest
