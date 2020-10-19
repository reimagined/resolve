import App from './components/App'
import Index from './components'
import NamedSelectors from './components/NamedSelectors'

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
        path: '/redux-hooks/named-selectors',
        component: NamedSelectors,
        exact: true,
      },
    ],
  },
]
