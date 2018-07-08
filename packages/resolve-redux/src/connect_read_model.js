import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from './actions'
import { connectorMetaMap, isReactiveArg } from './constants'
import getHash from './get_hash'
import connectResolveAdvanced from './connect_resolve_advanced'

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

    componentDidUpdate(prevProps) {
      const connectorOptions = this.props.connectorOptions
      const prevConnectorOptions = prevProps.connectorOptions
      if (
        connectorOptions &&
        prevConnectorOptions &&
        (prevConnectorOptions.readModelName !==
          connectorOptions.readModelName ||
          prevConnectorOptions.resolverName !== connectorOptions.resolverName ||
          prevConnectorOptions.resolverArgs !==
            connectorOptions.resolverArgs) &&
        (prevConnectorOptions.readModelName !==
          connectorOptions.readModelName ||
          prevConnectorOptions.resolverName !== connectorOptions.resolverName ||
          getHash(prevConnectorOptions.resolverArgs) !==
            getHash(connectorOptions.resolverArgs))
      ) {
        this.props.disconnectReadModel(
          prevConnectorOptions.readModelName,
          prevConnectorOptions.resolverName,
          prevConnectorOptions.resolverArgs,
          prevConnectorOptions.isReactive
        )
        this.props.connectReadModel(
          connectorOptions.readModelName,
          connectorOptions.resolverName,
          connectorOptions.resolverArgs,
          connectorOptions.isReactive
        )
      }
    }

    render() {
      const { ownProps, isLoading, data } = this.props

      // TODO
      if (isLoading !== false) {
        return null
      }

      return <Component {...ownProps} isLoading={isLoading} data={data} />
    }
  }

  const mapStateToConnectorProps = (state, ownProps) => {
    const connectorOptions = mapStateToOptions(state, ownProps)

    if (connectorOptions.isReactive) {
      Object.assign(connectorOptions.resolverArgs, { [isReactiveArg]: true })
    }
    const readModelName = connectorOptions.readModelName
    const resolverName = getHash(connectorOptions.resolverName)
    const resolverArgs = getHash(connectorOptions.resolverArgs)
    const isReactive = connectorOptions.isReactive

    if (isReactive) {
      Object.assign(resolverArgs, { [isReactiveArg]: true })
    }

    const connectorMeta =
      state.readModels &&
      state.readModels[connectorMetaMap] &&
      state.readModels[connectorMetaMap][
        `${readModelName}${resolverName}${resolverArgs}`
      ]
        ? state.readModels[connectorMetaMap][
            `${readModelName}${resolverName}${resolverArgs}`
          ]
        : {}

    const { isLoading, isFailure } = connectorMeta

    const data =
      isLoading === false && isFailure === false
        ? state.readModels[readModelName][resolverName][resolverArgs]
        : null

    const error =
      isLoading === false && isFailure === true ? connectorMeta.error : null

    return {
      ownProps,
      connectorOptions,
      isLoading,
      isFailure,
      data,
      error
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

  return connectResolveAdvanced(ReadModelConnector)
}

export default connectReadModel
