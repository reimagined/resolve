import App from './containers/App'
import Index from './containers/Index'
import UsersLikes from './containers/UserLikes'
import Users from './containers/Users'

export default [
  {
    component: App,
    routes: [
      {
        path: '/hoc',
        component: Index,
        exact: true,
      },
      {
        path: '/hoc/users',
        component: Users,
        exact: true,
      },
      {
        path: '/hoc/users-likes/:id',
        component: UsersLikes,
      },
    ],
  },
]
