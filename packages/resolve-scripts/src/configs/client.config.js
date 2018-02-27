import React from 'react'
import { createStore } from 'redux'

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_CLIENT_CONFIG'

const defaultConfig = {
  routes: [
    {
      path: '/',
      component: () => (
        <div>
          Routes not provided! Please set it in resolve.client.config.js
        </div>
      )
    }
  ],
  createStore: () => createStore(() => ({}), {})
}

export default { ...defaultConfig, ...config }
