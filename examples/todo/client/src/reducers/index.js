import { createReducer } from 'resolve-redux';
import { projections } from 'todo-common';

const projection = projections.cards;
const { name, eventHandlers } = projection;

export default createReducer({ name, eventHandlers });
