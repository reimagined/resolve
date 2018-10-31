import sinon from 'sinon'

import dispose from '../../src/view-model/dispose'

test('View-model dispose should dispose existing by aggregateIds', async () => {
  const viewModel = {}
  const repository = {
    viewMap: new Map([['KEY', viewModel]]),
    getKey: sinon.stub().callsFake(() => 'KEY')
  }

  await dispose(repository, { aggregateIds: ['FOR-KEY'] })

  expect(repository.getKey.callCount).toEqual(1)
  expect(repository.getKey.firstCall.args[0]).toEqual(['FOR-KEY'])

  expect(repository.viewMap.has('KEY')).toEqual(false)

  expect(viewModel.disposed).toEqual(true)
})

test('View-model dispose should work on non-existing aggregateIds', async () => {
  const repository = {
    viewMap: new Map(),
    getKey: sinon.stub().callsFake(() => 'KEY')
  }

  await dispose(repository, { aggregateIds: ['FOR-KEY'] })

  expect(repository.getKey.callCount).toEqual(1)
  expect(repository.getKey.firstCall.args[0]).toEqual(['FOR-KEY'])

  expect(repository.viewMap.has('KEY')).toEqual(false)
})

test('View-model dispose should dispose wildcard', async () => {
  const viewModelOne = {}
  const viewModelTwo = {}
  const repository = {
    viewMap: new Map([['KEY_ONE', viewModelOne], ['KEY_TWO', viewModelTwo]]),
    getKey: sinon.stub().callsFake()
  }

  await dispose(repository)

  expect(repository.getKey.callCount).toEqual(0)

  expect(repository.viewMap.has('KEY_ONE')).toEqual(false)
  expect(repository.viewMap.has('KEY_TWO')).toEqual(false)

  expect(viewModelOne.disposed).toEqual(true)
  expect(viewModelTwo.disposed).toEqual(true)
})
