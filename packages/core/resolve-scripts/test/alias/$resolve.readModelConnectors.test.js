import path from 'path'
import alias from '../../src/alias/$resolve.readModelConnectors'
import normalizePaths from './normalize_paths'

test('should fail when imported from client', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {},
          isClient: true
        }).code +
        '\r\n'
    )
  ).toThrow()
})

test('base config works correctly with module and options', () => {
  const resolveConfig = {
    readModelConnectors: {
      default: {
        module: path.join(__dirname, 'files', 'testReadmodelConnector.js'),
        options: {}
      }
    }
  }

  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})

test('base config works correctly with options and default module', () => {
  const resolveConfig = {
    readModelConnectors: {
      default: {
        options: {}
      }
    }
  }

  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})

test('base config works correctly with default module and options', () => {
  const resolveConfig = {
    readModelConnectors: {
      default: {
        module: path.join(__dirname, 'files', 'testReadmodelConnector.js')
      }
    }
  }

  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})
