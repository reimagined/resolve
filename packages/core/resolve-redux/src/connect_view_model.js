import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import hoistNonReactStatic from 'hoist-non-react-statics'

import * as actions from './actions'
import { connectorMetaMap } from './constants'
import getHash from './get_hash'
import connectResolveAdvanced from './connect_resolve_advanced'

export const mapDispatchToConnectorProps = dispatch =>
  bindActionCreators(
    {
      connectViewModel: actions.connectViewModel,
      disconnectViewModel: actions.disconnectViewModel
    },
    dispatch
  )

export const mapStateToConnectorProps = (
  mapStateToOptions,
  state,
  ownProps
) => {
  const connectorOptions = mapStateToOptions(state, ownProps)
  if (!connectorOptions.hasOwnProperty('aggregateArgs')) {
    connectorOptions.aggregateArgs = {}
  }
  if (
    Array.isArray(connectorOptions.aggregateIds) &&
    connectorOptions.aggregateIds.indexOf('*') !== -1
  ) {
    throw new Error(
      `Incorrect value of "aggregateIds". Maybe you meant to use "*", not ["*"]`
    )
  }

  const viewModelName = connectorOptions.viewModelName
  const aggregateIds = getHash(connectorOptions.aggregateIds)
  const aggregateArgs = getHash(connectorOptions.aggregateArgs)

  const connectorMeta =
    state.viewModels &&
    state.viewModels[connectorMetaMap] &&
    state.viewModels[connectorMetaMap][
      `${viewModelName}${aggregateIds}${aggregateArgs}`
    ]
      ? state.viewModels[connectorMetaMap][
          `${viewModelName}${aggregateIds}${aggregateArgs}`
        ]
      : {}

  const { isLoading, isFailure } = connectorMeta

  const data =
    isLoading === false && isFailure === false
      ? state.viewModels[viewModelName][aggregateIds][aggregateArgs]
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

const connectViewModel = mapStateToOptions => Component => {
  class ViewModelContainer extends React.PureComponent {
    componentDidMount() {
      const {
        viewModelName,
        aggregateIds,
        aggregateArgs
        // placeholder,
        // placeholderTimeout
      } = this.props.connectorOptions

      this.props.connectViewModel(viewModelName, aggregateIds, aggregateArgs)
    }

    componentWillUnmount() {
      const {
        viewModelName,
        aggregateIds,
        aggregateArgs
        // placeholder,
        // placeholderTimeout
      } = this.props.connectorOptions

      this.props.disconnectViewModel(viewModelName, aggregateIds, aggregateArgs)
    }

    componentDidUpdate(prevProps) {
      const connectorOptions = this.props.connectorOptions
      const prevConnectorOptions = prevProps.connectorOptions
      if (
        connectorOptions &&
        prevConnectorOptions &&
        (prevConnectorOptions.viewModelName !==
          connectorOptions.viewModelName ||
          prevConnectorOptions.aggregateIds !== connectorOptions.aggregateIds ||
          prevConnectorOptions.aggregateArgs !==
            connectorOptions.aggregateArgs) &&
        (prevConnectorOptions.viewModelName !==
          connectorOptions.viewModelName ||
          getHash(prevConnectorOptions.aggregateIds) !==
            getHash(connectorOptions.aggregateIds) ||
          getHash(prevConnectorOptions.aggregateArgs) !==
            getHash(connectorOptions.aggregateArgs))
      ) {
        this.props.disconnectViewModel(
          prevConnectorOptions.viewModelName,
          prevConnectorOptions.aggregateIds,
          prevConnectorOptions.aggregateArgs
        )
        this.props.connectViewModel(
          connectorOptions.viewModelName,
          connectorOptions.aggregateIds,
          connectorOptions.aggregateArgs
        )
      }
    }

    render() {
      const { ownProps, isLoading, data } = this.props
      return <Component {...ownProps} isLoading={isLoading} data={data} />
    }
  }

  const ViewModelConnector = connect(
    mapStateToConnectorProps.bind(null, mapStateToOptions),
    mapDispatchToConnectorProps
  )(ViewModelContainer)
  ViewModelConnector.mapStateToOptions = mapStateToOptions

  hoistNonReactStatic(ViewModelConnector, ViewModelContainer)

  return connectResolveAdvanced(ViewModelConnector)
}

export default connectViewModel
