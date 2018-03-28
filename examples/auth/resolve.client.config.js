import routes from './client/routes'
import createStore from './client/store'

if (module.hot) {
  module.hot.accept()
}

export default {
  routes,
  createStore
}
