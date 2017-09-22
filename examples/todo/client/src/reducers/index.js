import { createReducer } from 'resolve-redux';
import { readModel } from 'todo-common';

const { name, projection } = readModel;

export default createReducer({ name, projection });
