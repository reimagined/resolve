import App from './containers/App'
import Index from './containers/Index'
import OneViewModelMountedTwice from './containers/OneViewModelMountedTwice'
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
        path: '/hoc/twice-view-model-mount/:id',
        component: OneViewModelMountedTwice,
      },
    ],
  },
]
