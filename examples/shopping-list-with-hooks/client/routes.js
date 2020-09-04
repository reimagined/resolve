import App from './components/App'
import ShoppingList from './components/ShoppingList'
import MyLists from './components/MyLists'

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
