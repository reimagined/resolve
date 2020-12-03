import { App } from './components/App'
import { Index } from './components/Index'
import { NamedSelectors } from './components/NamedSelectors'

export default [
  {
    component: App,
    routes: [
      {
        path: '/redux-hooks',
        component: Index,
        exact: true,
      },
      {
        path: '/redux-hooks/named-selectors/:userId',
        component: NamedSelectors,
      },
    ],
  },
]
