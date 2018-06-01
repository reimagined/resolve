import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import actions from './actions'

const connectReadModel = mapStateToOptions => Component => {
  class ReadModelContainer extends React.PureComponent {
    componentDidMount() {
      // TODO placeholder
      const {
        readModelName,
        resolverName,
        resolverArgs,
        isReactive,
        placeholder,
        placeholderTimeout
      } = this.props.connectorOptions

      this.props.connectReadModel(
        readModelName,
        resolverName,
        resolverArgs,
        isReactive
      )
    }

    componentWillUnmount() {
      // TODO placeholder
      const {
        readModelName,
        resolverName,
        resolverArgs,
        isReactive,
        placeholder,
        placeholderTimeout
      } = this.props.connectorOptions

      this.props.disconnectReadModel(
        readModelName,
        resolverName,
        resolverArgs,
        isReactive
      )
    }

    render() {
      const { ownProps, isLoading, data } = this.props

      return <Component {...ownProps} isLoading={isLoading} data={data} />
    }
  }

  const mapStateToConnectorProps = (state, ownProps) => {
    const connectorOptions = mapStateToOptions(state, ownProps)

    const {
      readModels: {
        [`resolve-loading-${connectorOptions.readModelName}-${
          connectorOptions.resolverName
        }`]: isLoading,
        [connectorOptions.readModelName]: {
          [connectorOptions.resolverName]: data
        }
      }
    } = state

    return {
      ownProps,
      connectorOptions,
      isLoading,
      data
    }
  }

  const mapDispatchToConnectorProps = dispatch =>
    bindActionCreators(
      {
        connectReadModel: actions.connectReadModel,
        disconnectReadModel: actions.disconnectReadModel
      },
      dispatch
    )

  const ReadModelConnector = connect(
    mapStateToConnectorProps,
    mapDispatchToConnectorProps
  )(ReadModelContainer)
  ReadModelConnector.mapStateToOptions = mapStateToOptions

  return ReadModelConnector
}

export default connectReadModel
