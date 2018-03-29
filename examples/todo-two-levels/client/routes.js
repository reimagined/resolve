import App from './containers/App'
import TodoList from './components/TodoList'

export default [
  {
    path: '/:id',
    component: TodoList
  },
  {
    path: '/',
    component: App
  }
]
