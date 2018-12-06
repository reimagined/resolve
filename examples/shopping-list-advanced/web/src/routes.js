import App from './containers/App'
import ShoppingList from './containers/ShoppingList'
import MyLists from './containers/MyLists'
import ShareForm from './containers/ShareForm'
import Settings from './containers/Settings'
import Login from './containers/Login'

export default [
  {
    component: App,
    routes: [
      {
        path: '/login',
        component: Login,
        exact: true
      },
      {
        path: '/',
        component: MyLists,
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
        path: '/:id',
        component: ShoppingList
      }
    ]
  }
]
