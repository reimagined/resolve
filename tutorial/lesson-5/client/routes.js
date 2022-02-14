import App from './components/App'
import MyLists from './components/MyLists'
import ShoppingList from './components/ShoppingList'

const routes = [
  {
    component: App,
    routes: [
      {
        path: '/',
        component: MyLists,
        exact: true,
      },
      {
        path: '/:id',
        component: ShoppingList,
      },
    ],
  },
]

export default routes
