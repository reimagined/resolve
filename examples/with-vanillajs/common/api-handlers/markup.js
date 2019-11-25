import getStaticBasedPath from 'resolve-runtime/lib/common/utils/get-static-based-path'
import jsonUtfStringify from 'resolve-runtime/lib/common/utils/json-utf-stringify'

export default async (req, res) => {
  const { rootPath, staticPath, seedClientEnvs } = req.resolve
  const scriptUrl = getStaticBasedPath(rootPath, staticPath, 'index.js')
  const styleUrl = getStaticBasedPath(rootPath, staticPath, 'style.css')
  const initialState = {
    chat: await req.resolve.executeQuery({
      modelName: 'chat',
      aggregateIds: '*'
    })
  }

  const markupHtml = `<!doctype html>
  <html>
    <head>
      <link href="${styleUrl}" rel="stylesheet" />
      <script>
      window.__INITIAL_STATE__ = ${jsonUtfStringify(initialState)}
      window.__RESOLVE_RUNTIME_ENV__=${jsonUtfStringify(seedClientEnvs)}
      </script>
      <script src="${scriptUrl}"></script>
    </head>
    <body>
      <div id="main"></div>
    </body>
  </html>
  `

  await res.setHeader('Content-Type', 'text/html')

  await res.end(markupHtml)
}
