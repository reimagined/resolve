import { ViewModelQuery } from '@resolve-js/client'
import { ReduxState } from '../types'
import { getEntry } from './view-model-reducer'
import { useSelector } from 'react-redux'

function useReduxViewModelSelector(query: ViewModelQuery | string): any {
  if (typeof query === 'string') {
    return useSelector((state: ReduxState) => getEntry(state.viewModels, query))
  }
  return useSelector((state: ReduxState) =>
    getEntry(state.viewModels, {
      query,
    })
  )
}

export { useReduxViewModelSelector }
