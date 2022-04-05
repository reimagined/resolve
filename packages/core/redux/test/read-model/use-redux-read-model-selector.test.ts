import { useSelector } from 'react-redux'
import { mocked } from 'jest-mock'
import { getEntry } from '../../src/read-model/read-model-reducer'
import { useReduxReadModelSelector } from '../../src/read-model/use-redux-read-model-selector'
import { getSelectorState } from '../../src/read-model/initial-state-manager'
import { ResultStatus } from '../../src/types'

jest.mock('react-redux', () => ({
  useSelector: jest.fn((f) => f),
}))
jest.mock('../../src/read-model/read-model-reducer', () => ({
  getEntry: jest.fn(() => 'state-entry'),
}))
jest.mock('../../src/read-model/initial-state-manager', () => ({
  getSelectorState: jest.fn(),
}))

const mUseSelector = mocked(useSelector)
const mGetEntry = mocked(getEntry)
const mGetSelectorState = mocked(getSelectorState)

afterEach(() => {
  mUseSelector.mockClear()
  mGetEntry.mockClear()
  mGetSelectorState.mockClear()
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

  mGetSelectorState.mockReturnValueOnce('initial')

  const selector = useReduxReadModelSelector(query)
  expect(mUseSelector).toHaveBeenCalledWith(expect.any(Function))

  selector(state)

  expect(mGetEntry).toHaveBeenCalledWith(
    state.readModels,
    { query },
    {
      status: ResultStatus.Initial,
      data: 'initial',
    }
  )
})

test('by named selector', () => {
  const state = {
    readModels: {},
  }

  const selector = useReduxReadModelSelector('selector-id')
  expect(mUseSelector).toHaveBeenCalledWith(expect.any(Function))

  mGetSelectorState.mockReturnValueOnce('initial')

  selector(state)

  expect(mGetEntry).toHaveBeenCalledWith(state.readModels, 'selector-id', {
    status: ResultStatus.Initial,
    data: 'initial',
  })
})
