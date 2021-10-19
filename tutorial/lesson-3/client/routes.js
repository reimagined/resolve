import App from './components/App'
import MyLists from './components/MyLists'

export const routes = [
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
