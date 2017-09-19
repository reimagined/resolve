import { createReducer } from 'resolve-redux';
import { readModel } from 'todo-common';

const { name, eventHandlers } = readModel;

export default createReducer({ name, eventHandlers });
