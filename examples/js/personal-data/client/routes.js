import App from './components/App'
import Home from './components/Home'
import UserBlog from './components/UserBlog'
import Users from './components/Users'
import Profile from './components/Profile'
export const routes = [
  {
    component: App,
    routes: [
      {
        path: '/',
        component: Home,
        exact: true,
      },
      {
        path: '/users',
        component: Users,
      },
      {
        path: '/profile',
        component: Profile,
      },
      {
        path: '/blog/:id',
        component: UserBlog,
      },
    ],
  },
]
