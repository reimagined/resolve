import Layout from './components/Layout'
import App from './containers/App'

export default [
  {
    path: '/',
    component: Layout,
    routes: [
      {
        path: '/',
        component: App,
        exact: true
      }
    ]
  }
]
