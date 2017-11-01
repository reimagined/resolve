import { createReducer } from 'resolve-redux';
import readModel from '../../common/read-models';

export default createReducer({
    name: 'VIEW',
    projection: readModel.projection
});
