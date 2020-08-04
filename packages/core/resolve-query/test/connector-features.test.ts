import {
  detectConnectorFeatures,
  ReadModelConnectorFeatures
} from '../src/connector-features'

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

test('no features', () => {
  const features = detectConnectorFeatures(mockConnectorWithoutFeatures)
  expect(features).toEqual(ReadModelConnectorFeatures.None)
})

test('regular features', () => {
  const features = detectConnectorFeatures(mockRegularConnector)
  expect(features).toEqual(ReadModelConnectorFeatures.Regular)
})

test('XA features', () => {
  const features = detectConnectorFeatures(mockXAConnector)
  expect(features).toEqual(ReadModelConnectorFeatures.XA)
})

test('XA & regular features', () => {
  const features = detectConnectorFeatures(mockRegularConnectorWithXASupport)
  expect(features & ReadModelConnectorFeatures.Regular).toEqual(
    ReadModelConnectorFeatures.Regular
  )
  expect(features & ReadModelConnectorFeatures.XA).toEqual(
    ReadModelConnectorFeatures.XA
  )
})

test('XA & regular should equal All', () => {
  const features = detectConnectorFeatures(mockRegularConnectorWithXASupport)
  expect(features).toEqual(ReadModelConnectorFeatures.All)
})
