import App from './components/App'
import Login from './components/Login'

export default [
  {
    path: '/',
    component: App,
    exact: true
  },
  {
    path: '/login',
    component: Login,
    exact: true
  }
]
