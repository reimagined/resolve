import App from './components/App'
import Home from './components/Home'
import UserBlog from './components/UserBlog'
import Users from './components/Users'
// import Feed from './components/Feed'
// import MyProfile from './components/MyProfile'

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
        path: '/users',
        component: Users
      },
/*       {
        path: '/profile',
        component: MyProfile
      }, */
      {
        path: '/blog/:id',
        component: UserBlog
      }
    ]
  }
]
