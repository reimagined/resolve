import App from './containers/App'
import Authentication from './containers/Authentication'

export default [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/',
        component: Authentication,
        exact: true
      }
    ]
  }
]
