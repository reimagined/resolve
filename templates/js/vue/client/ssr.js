import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import { getClient } from '@resolve-js/client'
import { createRenderer } from 'vue-server-renderer'
import App from './App.vue'
const entryPoint = async (serverContext, req, res) => {
  try {
    const { constants, seedClientEnvs, viewModels } = serverContext
    const client = getClient({
      ...constants,
      viewModels,
      origin: '',
    })
    Vue.use(BootstrapVue)
    const renderer = createRenderer()
    const bundleUrl = client.getStaticAssetUrl('/index.js')
    const bootstrapCssUrl = client.getStaticAssetUrl('/bootstrap.css')
    const bootstrapVueCssUrl = client.getStaticAssetUrl('/bootstrap-vue.css')
    const app = new Vue({
      data: { client },
      render: (h) => h(App),
    })
    const renderedHtml = await new Promise((resolve, reject) =>
      renderer.renderToString(app, (err, html) =>
        err == null ? resolve(html) : reject(err)
      )
    )
    await res.setHeader('Content-Type', 'text/html')
    await res.end(`
      <!doctype html>
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="${bootstrapCssUrl}" />
          <link rel="stylesheet" type="text/css" href="${bootstrapVueCssUrl}" />
          <script>
          window.__RESOLVE_RUNTIME_ENV__=${JSON.stringify(seedClientEnvs)}
          </script>
        </head>
        <body>
          ${renderedHtml}
          <script src="${bundleUrl}"></script>
        </body>
      </html>
    `)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Vue SSR error', error)
    await res.status(500)
    await res.end('Vue SSR error')
  }
}
export default entryPoint
