import { createReducer } from 'resolve-redux';
import todosProjection from '../../common/read-models/todos';

const { name, projection } = todosProjection;

export default createReducer({ name, projection });
