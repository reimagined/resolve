import { App } from './components/App'
import { Counter } from './components/Counter'
import { UseRequestMiddleware } from './components/UseRequestMiddleware'

export default [
  {
    component: App,
    routes: [
      {
        path: '/counter/:id',
        component: Counter,
      },
      {
        path: '/client-middleware/:id',
        component: UseRequestMiddleware,
        exact: true,
      },
    ],
  },
]
