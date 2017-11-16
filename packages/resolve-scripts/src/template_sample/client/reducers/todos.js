import { createReducer } from 'resolve-redux';
import viewModel from '../../common/view-models/default';

export default createReducer({
    name: 'VIEW',
    projection: viewModel.projection
});
