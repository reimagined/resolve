import RequiredAuth from './containers/RequiredAuth'
import App from './containers/App'
import ShoppingList from './containers/ShoppingList'
import AllShoppingLists from './containers/ShoppingLists'
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
            path: '/all',
            component: AllShoppingLists,
            exact: true
          },
          {
            path: '/share/:id',
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
