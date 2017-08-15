import { createReducer } from 'resolve-redux';
import todosProjection from '../../common/read-models/todos';

const { name, eventHandlers } = todosProjection;

export default createReducer({ name, eventHandlers });
