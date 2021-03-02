import { useSelector } from 'react-redux'
import { mocked } from 'ts-jest/utils'
import { getEntry } from '../../src/read-model/read-model-reducer'
import { useReduxReadModelSelector } from '../../src/read-model/use-redux-read-model-selector'

jest.mock('react-redux', () => ({
  useSelector: jest.fn((f) => f),
}))
jest.mock('../../src/read-model/read-model-reducer', () => ({
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
    readModels: {},
  }

  const query = {
    name: 'read-model',
    resolver: 'resolver',
    args: {
      a: 'a',
    },
  }

  const selector = useReduxReadModelSelector(query)
  expect(mUseSelector).toHaveBeenCalledWith(expect.any(Function))

  selector(state)

  expect(mGetEntry).toHaveBeenCalledWith(state.readModels, { query })
})

test('by named selector', () => {
  const state = {
    readModels: {},
  }

  const selector = useReduxReadModelSelector('selector-id')
  expect(mUseSelector).toHaveBeenCalledWith(expect.any(Function))

  selector(state)

  expect(mGetEntry).toHaveBeenCalledWith(state.readModels, 'selector-id')
})
