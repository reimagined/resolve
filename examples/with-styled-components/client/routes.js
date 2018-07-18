import App from './containers/App'
import StyledComponents from './containers/StyledComponents'

export default [
  {
    path: '/',
    component: App,
    routes: [
      {
        path: '/',
        component: StyledComponents,
        exact: true
      }
    ]
  }
]
