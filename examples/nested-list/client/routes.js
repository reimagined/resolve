import Index from './containers/Index'
import Todos from './containers/Todos'
import App from './containers/App'

export default [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/:id',
        component: Todos,
        exact: true
      },
      {
        path: '/',
        component: Index,
        exact: true
      }
    ]
  }
]
