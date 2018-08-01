import App from './containers/App'
import TopList from './containers/TopList'

export default [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/',
        component: TopList,
        exact: true
      }
    ]
  }
]
