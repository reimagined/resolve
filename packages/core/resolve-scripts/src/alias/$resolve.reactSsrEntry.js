import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (resolveConfig.redux == null || resolveConfig.routes == null) {
    throw new Error(`${message.configNotContainSectionError}redux, routes`)
  }
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.reactSsrEntry`
    )
  }

  return {
    code: `
      import React from 'react'
      import ReactDOM from 'react-dom/server'
      import { createMemoryHistory } from 'history'
      import jsonwebtoken from 'jsonwebtoken'
      import { createStore, AppContainer } from 'resolve-redux'
      import { Helmet } from 'react-helmet'

      import getRootBasedUrl from 'resolve-runtime/lib/common/utils/get-root-based-url'
      import getStaticBasedPath from 'resolve-runtime/lib/common/utils/get-static-based-path'
      import jsonUtfStringify from 'resolve-runtime/lib/common/utils/json-utf-stringify'

      import reactIsomorphic from '$resolve.reactIsomorphic'
      import rootPath from '$resolve.rootPath'
      import staticPath from '$resolve.staticPath'
      import viewModels from '$resolve.viewModels'
      import seedClientEnvs from '$resolve.seedClientEnvs'
      import jwtCookie from '$resolve.jwtCookie'

      const liveRequire = filePath => {
        const resource = eval(\`require(\${JSON.stringify(filePath)})\`)
        eval(\`delete require.cache[require.resolve(\${JSON.stringify(filePath)})]\`)
        return resource
      }

      const StyledComponents = {}
      try {
        Object.assign(StyledComponents, liveRequire('styled-components'), { isActive: true })
      } catch(err) {}

      const baseQueryUrl = getRootBasedUrl(rootPath, '/')
      const origin = ''

      const markupHandler = async (req, res) => {
        const url = req.path.substring(baseQueryUrl.length)
        const history = createMemoryHistory()
        history.push(url)

        const jwt = {}
        try {
          Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookie.name]))
        } catch (e) {}

        const store = createStore({
          redux: reactIsomorphic.redux,
          viewModels,
          subscribeAdapter: {},
          initialState: { jwt },
          history,
          origin,
          rootPath,
          isClient: false
        })

        const appContainer = (
          <AppContainer
            origin={origin}
            rootPath={rootPath}
            staticPath={staticPath}
            store={store}
            history={history}
            routes={reactIsomorphic.routes}
            isSSR={true}
          />
        )

        let markup = ''
        let styleTags = ''
        if(StyledComponents.isActive) {
          const sheet = new StyledComponents.ServerStyleSheet()

          markup = ReactDOM.renderToStaticMarkup(
            <StyledComponents.StyleSheetManager sheet={sheet.instance}>
              {appContainer}
            </StyledComponents.StyleSheetManager>
          )
  
          styleTags = sheet.getStyleTags()
        } else {
          markup = ReactDOM.renderToStaticMarkup(
            appContainer
          )
        }

        const initialState = store.getState()
        const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'react-entry.js')
        const faviconUrl = getStaticBasedPath(rootPath, staticPath, 'favicon.ico')

        const helmet = Helmet.renderStatic()

        for (const reducerName of Object.keys(reactIsomorphic.redux.reducers)) {
          delete initialState[reducerName]
        }

        const markupHtml =
          \`<!doctype html>\` +
          \`<html \${helmet.htmlAttributes.toString()}>\` +
          '<head>' +
          \`<link rel="icon" type="image/x-icon" href="\${faviconUrl}" />\` +
          \`\${helmet.title.toString()}\` +
          \`\${helmet.meta.toString()}\` +
          \`\${helmet.link.toString()}\` +
          \`\${helmet.style.toString()}\` +
          styleTags +
          '<script>' +
          \`window.__INITIAL_STATE__=\${jsonUtfStringify(initialState)};\` +
          \`window.__RESOLVE_RUNTIME_ENV__=\${jsonUtfStringify(seedClientEnvs)};\` +
          '</script>' +
          \`\${helmet.script.toString()}\` +
          '</head>' +
          \`<body \${helmet.bodyAttributes.toString()}>\` +
          \`<div class="app-container">\${markup}</div>\` +
          \`<script src="\${bundleUrl}"></script>\` +
          '</body>' +
          '</html>'

        await res.setHeader('Content-Type', 'text/html')

        await res.end(markupHtml)
      }

      export default markupHandler
    `
  }
}
