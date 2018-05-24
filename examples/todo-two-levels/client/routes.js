import Index from './containers/Index';
import Todo from './containers/Todo';

export default [
  {
    path: '/:id',
    component: Todo
  },
  {
    path: '/',
    component: Index
  }
];
