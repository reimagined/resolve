import { createReducer } from 'resolve-redux';
import readModel from '../../common/read-models/default';

export default createReducer({
    name: 'VIEW',
    projection: readModel.projection
});
