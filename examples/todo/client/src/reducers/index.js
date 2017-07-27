import { createReducer } from 'resolve-redux';
import { readModels } from 'todo-common';

const cards = readModels.cards;
const { name, eventHandlers } = cards;

export default createReducer({ name, eventHandlers });
