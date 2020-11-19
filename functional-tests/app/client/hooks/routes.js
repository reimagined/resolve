import { App } from './components/App'
import { Counter } from './components/Counter'
import { UseRequestMiddleware } from './components/UseRequestMiddleware'

export default [
  {
    component: App,
    routes: [
      {
        path: '/counter',
        component: Counter,
        exact: true,
      },
      {
        path: '/request-middleware',
        component: UseRequestMiddleware,
        exact: true,
      },
    ],
  },
]
