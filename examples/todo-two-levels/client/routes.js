import Todo from './components/Todo'
import Index from './components/Todo'

export default [
  {
    path: '/:id',
    component: Todo
  },
  {
    path: '/',
    component: Index
  }
]
