import { createReducer } from 'resolve-redux';
import readModel from '../../common/view-models/default';

export default createReducer({
    name: 'VIEW',
    projection: readModel.projection
});
