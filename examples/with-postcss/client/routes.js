import App from './containers/App'
import PostCSS from './containers/PostCSS'

export default [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/',
        component: PostCSS,
        exact: true
      }
    ]
  }
]
