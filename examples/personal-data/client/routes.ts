import App from './components/App'
import UserBlog from './components/UserBlog'

export default [
  {
    component: App,
    routes: [
      {
        path: '/blog/:id',
        component: UserBlog
      }
    ]
  }
]
