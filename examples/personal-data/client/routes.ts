import App from './components/App'
import Home from './components/Home'
import UserBlog from './components/UserBlog'
import Feed from './components/Feed'

export default [
  {
    component: App,
    routes: [
      {
        path: '/',
        component: Home,
        exact: true
      },
      {
        path: '/feed',
        component: Feed
      },
      {
        path: '/blog/:id',
        component: UserBlog
      }
    ]
  }
]
