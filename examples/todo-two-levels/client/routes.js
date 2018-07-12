import Index from './containers/Index'
import Todo from './containers/Todo'
import Layout from './components/Layout'

export default [
  {
    path: '/',
    component: Layout,
    routes: [
      {
        path: '/:id',
        component: Todo,
        exact: true
      },
      {
        path: '/',
        component: Index,
        exact: true
      }
    ]
  }
]
