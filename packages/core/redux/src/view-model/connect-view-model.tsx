import React from 'react'
import { v4 as uuid } from 'uuid'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import hoistNonReactStatic from 'hoist-non-react-statics'

import * as actions from './actions'
import getHash from '../internal/get-hash'
import connectResolveAdvanced from '../internal/connect-resolve-advanced'
import { getEntry } from './view-model-reducer'
import { ReduxState, ResultStatus } from '../types'

type ViewModelConnectorOptions = {
  viewModelName: string
  aggregateIds: string[]
  aggregateArgs: any
}
export type ViewModelConnectorOptionsMapper = (
  state: ReduxState,
  ownProps: any
) => ViewModelConnectorOptions

export const mapDispatchToConnectorProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      connectViewModel: actions.connectViewModel,
      disconnectViewModel: actions.disconnectViewModel,
    },
    dispatch
  )

export const mapStateToConnectorProps = (
  mapStateToOptions: ViewModelConnectorOptionsMapper,
  state: ReduxState,
  ownProps: any
): any => {
  const connectorOptions = mapStateToOptions(state, ownProps)

  const entry = getEntry(state.viewModels, {
    query: {
      name: connectorOptions.viewModelName,
      aggregateIds: connectorOptions.aggregateIds,
      args: connectorOptions.aggregateArgs,
    },
  })
  const data = entry && entry.status === ResultStatus.Ready ? entry.data : null
  const error =
    entry && entry.status === ResultStatus.Failed ? entry.error : null

  return {
    ownProps,
    connectorOptions,
    isLoading: entry && entry.status === ResultStatus.Requested,
    isFailure: entry && entry.status === ResultStatus.Failed,
    data,
    error,
  }
}

const connectViewModel = (
  mapStateToOptions: ViewModelConnectorOptionsMapper
): any => (Component: any): any => {
  const selectorId = uuid()
  class ViewModelContainer extends React.PureComponent<any> {
    componentDidMount() {
      const {
        viewModelName,
        aggregateIds,
        aggregateArgs,
      } = this.props.connectorOptions

      this.props.connectViewModel(
        {
          name: viewModelName,
          aggregateIds: aggregateIds,
          args: aggregateArgs,
        },
        selectorId
      )
    }

    componentWillUnmount() {
      const {
        viewModelName,
        aggregateIds,
        aggregateArgs,
      } = this.props.connectorOptions

      this.props.disconnectViewModel(
        {
          name: viewModelName,
          aggregateIds: aggregateIds,
          args: aggregateArgs,
        },
        selectorId
      )
    }

    componentDidUpdate(prevProps: any) {
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
          getHash(prevConnectorOptions.aggregateArgs, 'empty') !==
            getHash(connectorOptions.aggregateArgs, 'empty'))
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
  )(ViewModelContainer) as any

  ViewModelConnector.mapStateToOptions = mapStateToOptions

  hoistNonReactStatic(ViewModelConnector, ViewModelContainer)

  return connectResolveAdvanced(ViewModelConnector)
}

export default connectViewModel
