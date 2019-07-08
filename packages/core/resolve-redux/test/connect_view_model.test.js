import { mapStateToConnectorProps } from '../src/connect_view_model'

describe('connectViewModel', () => {
  test('should failed with aggregateIds = ["*"]', () => {
    const mapStateToOptions = () => ({
      aggregateIds: ['*'],
      viewModelName: 'test'
    })

    const state = {}
    const ownProps = {}

    expect(() =>
      mapStateToConnectorProps(mapStateToOptions, state, ownProps)
    ).toThrow(
      `Incorrect value of "aggregateIds". Maybe you meant to use "*", not ["*"]`
    )
  })

  test('should works correctly with aggregateIds = "*"', () => {
    const mapStateToOptions = () => ({
      aggregateIds: '*',
      viewModelName: 'test'
    })

    const state = {}
    const ownProps = {}

    const { connectorOptions } = mapStateToConnectorProps(
      mapStateToOptions,
      state,
      ownProps
    )

    expect(connectorOptions).toMatchObject({
      aggregateIds: '*',
      viewModelName: 'test'
    })
  })
})
