import App from './containers/App'
import Index from './containers/Index'
import OneViewModelMountedTwice from './containers/OneViewModelMountedTwice'
import ViewModelIsolation from './containers/ViewModelsolation'
import Users from './containers/Users'

export const routes = [
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
      {
        path: '/hoc/view-model-isolation/:id',
        component: ViewModelIsolation,
      },
    ],
  },
]
