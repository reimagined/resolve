import App from './containers/App'
import Todos from './containers/Todos'

export default [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/',
        component: Todos,
        exact: true
      }
    ]
  }
]
