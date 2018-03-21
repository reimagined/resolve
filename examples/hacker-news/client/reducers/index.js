import { combineReducers } from 'redux'
import { createViewModelsReducer } from 'resolve-redux'

import optimistic from './optimistic'

export default combineReducers({
  viewModels: createViewModelsReducer(),
  optimistic
})
