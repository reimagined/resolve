import Index from './components/Index'
import Todo from './components/Todo'

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
