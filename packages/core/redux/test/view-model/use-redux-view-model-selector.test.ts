import { useSelector } from 'react-redux'
import { mocked } from 'jest-mock'
import { getEntry } from '../../src/view-model/view-model-reducer'
import { useReduxViewModelSelector } from '../../src/view-model/use-redux-view-model-selector'

jest.mock('react-redux', () => ({
  useSelector: jest.fn((f) => f),
}))
jest.mock('../../src/view-model/view-model-reducer', () => ({
  getEntry: jest.fn(() => 'state-entry'),
}))

const mUseSelector = mocked(useSelector)
const mGetEntry = mocked(getEntry)

afterEach(() => {
  mUseSelector.mockClear()
  mGetEntry.mockClear()
})

test('by query plain object', () => {
  const state = {
    viewModels: {},
  }

  const query = {
    name: 'modelName',
    aggregateIds: ['id1'],
    args: {
      a: 'a',
    },
  }

  const selector = useReduxViewModelSelector(query)
  expect(mUseSelector).toHaveBeenCalledWith(expect.any(Function))

  selector(state)

  expect(mGetEntry).toHaveBeenCalledWith(state.viewModels, { query })
})

test('by named selector', () => {
  const state = {
    viewModels: {},
  }

  const selector = useReduxViewModelSelector('selector-id')
  expect(mUseSelector).toHaveBeenCalledWith(expect.any(Function))

  selector(state)

  expect(mGetEntry).toHaveBeenCalledWith(state.viewModels, 'selector-id')
})
