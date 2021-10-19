import App from './containers/App'
import ShoppingList from './containers/ShoppingList'
import MyLists from './containers/MyLists'
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
export const getRoutes = () => routes
