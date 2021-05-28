/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */

describe('Regression test: maintenance mode', () => {
  test('Strict Equals Operator "===" should return true for a/node_modules/@resolve-js/eventstore-base and b/node_modules/@resolve-js/eventstore-base', () => {
    const A = require('../src/constants')
    const {
      MAINTENANCE_MODE_AUTO: A_MAINTENANCE_MODE_AUTO,
      MAINTENANCE_MODE_MANUAL: A_MAINTENANCE_MODE_MANUAL,
    } = A

    jest.resetModules()

    const B = require('../src/constants')
    const {
      MAINTENANCE_MODE_AUTO: B_MAINTENANCE_MODE_AUTO,
      MAINTENANCE_MODE_MANUAL: B_MAINTENANCE_MODE_MANUAL,
    } = B

    expect(A_MAINTENANCE_MODE_AUTO).toEqual(B_MAINTENANCE_MODE_AUTO)
    expect(A_MAINTENANCE_MODE_MANUAL).toEqual(B_MAINTENANCE_MODE_MANUAL)
  })
})
