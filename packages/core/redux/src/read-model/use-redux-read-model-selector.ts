import { ReadModelQuery } from '@resolve-js/client'
import { ReduxState, ResultStatus } from '../types'
import { getEntry } from './read-model-reducer'
import { useSelector } from 'react-redux'
import { getSelectorState } from './initial-state-manager'

function useReduxReadModelSelector(query: ReadModelQuery | string): any {
  const actualSelector = typeof query === 'string' ? query : { query }

  return useSelector((state: ReduxState) =>
    getEntry(state.readModels, actualSelector, {
      status: ResultStatus.Initial,
      data: getSelectorState(actualSelector),
    })
  )
}

export { useReduxReadModelSelector }
