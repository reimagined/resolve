import { App } from './components/App'
import { Counter } from './components/Counter'
import { UseRequestMiddleware } from './components/UseRequestMiddleware'
import { SecretsManager } from './components/SecretsManager'

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
      {
        path: '/secrets-manager',
        component: SecretsManager,
        exact: true,
      },
    ],
  },
]
