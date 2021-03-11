import { ReadModelQuery } from '@resolve-js/client'
import { ReduxState } from '../types'
import { getEntry } from './read-model-reducer'
import { useSelector } from 'react-redux'

function useReduxReadModelSelector(query: ReadModelQuery | string): any {
  if (typeof query === 'string') {
    return useSelector((state: ReduxState) => getEntry(state.readModels, query))
  }
  return useSelector((state: ReduxState) =>
    getEntry(state.readModels, {
      query,
    })
  )
}

export { useReduxReadModelSelector }
