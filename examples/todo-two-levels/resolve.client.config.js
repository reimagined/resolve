import React from 'react'
import { BrowserRouter } from 'react-router-dom'

import App from './client/components/App'
import createStore from './client/store'

if (module.hot) {
  module.hot.accept()
}

export default {
  rootComponent: () => (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  ),
  createStore
}
