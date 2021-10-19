import App from './components/App'
import ShoppingList from './components/ShoppingList'
import MyLists from './components/MyLists'

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

const getRoutes = () => routes

export default getRoutes
