import App from './containers/App'
import Index from './containers/Index'

export default [
  {
    component: App,
    routes: [
      {
        path: '/redux-hooks',
        component: Index,
        exact: true,
      },
    ],
  },
]
