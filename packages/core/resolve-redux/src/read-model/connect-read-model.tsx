import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import hoistNonReactStatic from 'hoist-non-react-statics'

import {
  connectReadModel as connectReadModelAction,
  disconnectReadModel as disconnectReadModelAction
} from './actions'
import getHash from '../get-hash'
import connectResolveAdvanced from '../connect_resolve_advanced'
import { ReadModelResultState, ReduxState } from '../types'
import { getEntry } from './read-model-reducer'

type ReadModelConnectorOptions = {
  readModelName: string
  resolverName: string
  resolverArgs: any
}
type ReadModelConnectorOptionsMapper = (
  state: ReduxState,
  ownProps: any
) => ReadModelConnectorOptions

const connectReadModel = (
  mapStateToOptions: ReadModelConnectorOptionsMapper
) => (Component: any): any => {
  class ReadModelContainer extends React.PureComponent<any> {
    componentDidMount(): void {
      const {
        readModelName,
        resolverName,
        resolverArgs
      } = this.props.connectorOptions

      this.props.connectReadModel(readModelName, resolverName, resolverArgs)
    }

    componentWillUnmount(): void {
      const {
        readModelName,
        resolverName,
        resolverArgs
      } = this.props.connectorOptions

      this.props.disconnectReadModel(readModelName, resolverName, resolverArgs)
    }

    componentDidUpdate(prevProps: any): void {
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
          prevConnectorOptions.resolverArgs
        )
        this.props.connectReadModel(
          connectorOptions.readModelName,
          connectorOptions.resolverName,
          connectorOptions.resolverArgs
        )
      }
    }

    render(): any {
      const { ownProps, isLoading, data } = this.props
      return <Component {...ownProps} isLoading={isLoading} data={data} />
    }
  }

  const mapStateToConnectorProps = (state: ReduxState, ownProps: any): any => {
    const connectorOptions = mapStateToOptions(state, ownProps)

    const entry = getEntry(state.readModels, connectorOptions)
    const data =
      entry && entry.state === ReadModelResultState.Ready ? entry.data : null
    const error =
      entry && entry.state === ReadModelResultState.Failed ? entry.error : null

    return {
      ownProps,
      connectorOptions,
      isLoading: entry && entry.state === ReadModelResultState.Requested,
      isFailure: entry && entry.state === ReadModelResultState.Failed,
      data,
      error
    }
  }

  const mapDispatchToConnectorProps = (dispatch: Dispatch): any =>
    bindActionCreators(
      {
        connectReadModel: connectReadModelAction,
        disconnectReadModel: disconnectReadModelAction
      },
      dispatch
    )

  const ReadModelConnector = connect(
    mapStateToConnectorProps,
    mapDispatchToConnectorProps
  )(ReadModelContainer) as any

  ReadModelConnector.mapStateToOptions = mapStateToOptions

  hoistNonReactStatic(ReadModelConnector, ReadModelContainer)

  return connectResolveAdvanced(ReadModelConnector)
}

export default connectReadModel
