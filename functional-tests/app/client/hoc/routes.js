import App from './containers/App'
import Index from './containers/Index'
import UsersLikes from './containers/UsersLikes'

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
        path: '/hoc/users-likes',
        component: UsersLikes,
      },
    ],
  },
]
