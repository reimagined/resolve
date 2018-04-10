import Index from './containers/Index'
import Todo from './containers/Todo'

export default [
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
