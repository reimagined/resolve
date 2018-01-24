import React from 'react'
import { createStore } from 'redux'

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import config from 'RESOLVE_CLIENT_CONFIG'

const emptyRootComponent = () => (
  <div>
    No root component provided! Please set it in resolve.client.config.js
  </div>
)
const emptyCreateStore = () => createStore(() => ({}), {})

const defaultConfig = {
  rootComponent: emptyRootComponent,
  createStore: emptyCreateStore
}

export default { ...defaultConfig, ...config }
