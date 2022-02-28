import App from './components/App'
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
    ],
  },
]

export default routes
