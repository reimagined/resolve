import App from './components/App'
import MyLists from './components/MyLists'
import ShoppingList from './components/ShoppingList'

export default [
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