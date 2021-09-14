import { getStaticBasedPath } from '@resolve-js/core'

import type { ResolveRequest, ResolveResponse } from '../types'

export const markupHandler = async (req: ResolveRequest, res: ResolveResponse) => {
  const { seedClientEnvs, staticPath, rootPath } = req.resolve
  const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'index.js')
  await res.setHeader('Content-Type', 'text/html')
  await res.end(`
    <!doctype html>
    <html>
      <head>
        <script>
        window.__RESOLVE_RUNTIME_ENV__=${JSON.stringify(seedClientEnvs)}
        window.__ENTRY_POINT_LOADED__=false
        window.__CHECK_ENTRY_POINT__=function() {
          if(!window.__ENTRY_POINT_LOADED__) {
            document.body.innerHTML = "Index bundle at ${bundleUrl} cannot be loaded"
          }
        }
        </script>
      </head>
      <body onLoad="window.__CHECK_ENTRY_POINT__()">
        <script src="${bundleUrl}" onLoad="void(window.__ENTRY_POINT_LOADED__=true)">
        </script>
      </body>
    </html>
  `)
}
