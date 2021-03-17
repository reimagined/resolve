import { App } from './components/App'
import { Index } from './components/Index'
import { NamedSelectors } from './components/NamedSelectors'
import { ArrayWithQueryString } from './components/ArrayWithinQueryString'
import { BasicViewModelTests } from './components/ViewModel'

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
      {
        path: '/redux-hooks/array-within-query-string/:runId',
        component: ArrayWithQueryString,
      },
      {
        path: '/redux-hooks/view-model/:runId',
        component: BasicViewModelTests,
      },
    ],
  },
]
