// TODO: use resolve-redux root path
import reducer from 'resolve-redux/dist/reducer';
import { cards as projection } from 'todo-common';

const { name, eventHandlers } = projection;

export default reducer({ name, eventHandlers });
