import Index from './containers/Index'
import Todos from './containers/Todos'
import Login from './containers/Login'
import App from './containers/App'

export default [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/login',
        component: Login,
        exact: true
      },
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
