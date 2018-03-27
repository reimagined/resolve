import { combineReducers } from 'redux'
import { createViewModelsReducer, createReadModelsReducer } from 'resolve-redux'

import optimistic from './optimistic'

export default combineReducers({
  viewModels: createViewModelsReducer(),
  readModels: createReadModelsReducer(),
  optimistic
})
