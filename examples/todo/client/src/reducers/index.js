import { reducer } from 'resolve-redux';
import { projections } from 'todo-common';

const projection = projections.cards;
const { name, eventHandlers } = projection;

export default reducer({ name, eventHandlers });
