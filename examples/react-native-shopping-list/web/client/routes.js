import RequiredAuth from './containers/RequiredAuth'
import App from './containers/App'
import ShoppingList from './containers/ShoppingList'
import Index from './containers/Index'
import ShareForm from './containers/ShareForm'
import Settings from './containers/Settings'
import LoginForm from './components/LoginForm'

export default [
  {
    component: App,
    routes: [
      {
        path: '/login',
        component: LoginForm,
        exact: true
      },
      {
        component: RequiredAuth,
        routes: [
          {
            path: '/',
            component: Index,
            exact: true
          },
          {
            path: '/settings',
            component: Settings,
            exact: true
          },
          {
            path: '/share/:id',
            component: ShareForm,
            exact: true
          },
          {
            path: '/:id?',
            component: ShoppingList
          }
        ]
      }
    ]
  }
]
