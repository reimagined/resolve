import App from './components/App'
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
    ],
  },
]
