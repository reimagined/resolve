// TODO: use resolve-redux root path
import reducer from 'resolve-redux/dist/reducer';
import { projections } from 'todo-common';

const projection = projections.cards;
const { name, eventHandlers } = projection;

export default reducer({ name, eventHandlers });
