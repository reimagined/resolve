import { createReducer } from 'resolve-redux';
import readModel from '../../common/read-model';

export default createReducer({
    name: 'VIEW',
    projection: readModel.projection
});
