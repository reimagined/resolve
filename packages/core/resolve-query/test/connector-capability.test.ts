import {
  getConnectorCapability,
  ReadModelConnectorCapability
} from '../src/connector-capability'

const mockConnectorWithoutFeatures = {
  someFunction: jest.fn()
}

const mockRegularConnector = {
  beginTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn()
}

const mockXAConnector = {
  beginXATransaction: jest.fn(),
  commitXATransaction: jest.fn(),
  rollbackXATransaction: jest.fn(),
  beginEvent: jest.fn(),
  commitEvent: jest.fn(),
  rollbackEvent: jest.fn()
}

const mockRegularConnectorWithXASupport = {
  ...mockRegularConnector,
  ...mockXAConnector
}

test('none', () => {
  expect(getConnectorCapability(mockConnectorWithoutFeatures)).toEqual(
    ReadModelConnectorCapability.None
  )
})

test('regular', () => {
  expect(getConnectorCapability(mockRegularConnector)).toEqual(
    ReadModelConnectorCapability.Regular
  )
})

test('XA', () => {
  expect(getConnectorCapability(mockXAConnector)).toEqual(
    ReadModelConnectorCapability.XA
  )
})

test('XA & regular should be resolved to XA', () => {
  expect(getConnectorCapability(mockRegularConnectorWithXASupport)).toEqual(
    ReadModelConnectorCapability.XA
  )
})
