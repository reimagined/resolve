import createStore from './client/store'
import routes from './client/routes'

if (module.hot) {
  module.hot.accept()
}

export default {
  routes,
  createStore
}
