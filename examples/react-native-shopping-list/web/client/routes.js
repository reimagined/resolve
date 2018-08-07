import RequiredAuth from './containers/RequiredAuth'
import App from './containers/App'
import ShoppingList from './containers/ShoppingList'
import NewShoppingList from './containers/NewShoppingList'
import ShareForm from './containers/ShareForm'
import Settings from './containers/Settings'
import LoginForm from './components/LoginForm'

export default [
  {
    path: '/:id?',
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
            path: '/settings',
            component: Settings,
            exact: true
          },
          {
            path: '/new',
            component: NewShoppingList,
            exact: true
          },
          {
            path: '/share',
            component: ShareForm,
            exact: true
          },
          {
            component: ShoppingList
          }
        ]
      }
    ]
  }
]
