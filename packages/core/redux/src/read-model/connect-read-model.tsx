import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import hoistNonReactStatic from 'hoist-non-react-statics'

import {
  connectReadModel as connectReadModelAction,
  disconnectReadModel as disconnectReadModelAction,
} from './actions'
import getHash from '../internal/get-hash'
import connectResolveAdvanced from '../internal/connect-resolve-advanced'
import { ResultStatus, ReduxState } from '../types'
import { getEntry } from './read-model-reducer'

type ReadModelConnectorOptions = {
  readModelName: string
  resolverName: string
  resolverArgs: any
}
export type ReadModelConnectorOptionsMapper = (
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
        resolverArgs,
      } = this.props.connectorOptions

      this.props.connectReadModel({
        name: readModelName,
        resolver: resolverName,
        args: resolverArgs,
      })
    }

    componentWillUnmount(): void {
      const {
        readModelName,
        resolverName,
        resolverArgs,
      } = this.props.connectorOptions

      this.props.disconnectReadModel({
        name: readModelName,
        resolver: resolverName,
        args: resolverArgs,
      })
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
        this.props.disconnectReadModel({
          name: prevConnectorOptions.readModelName,
          resolver: prevConnectorOptions.resolverName,
          args: prevConnectorOptions.resolverArgs,
        })
        this.props.connectReadModel({
          name: connectorOptions.readModelName,
          resolver: connectorOptions.resolverName,
          args: connectorOptions.resolverArgs,
        })
      }
    }

    render(): any {
      const { ownProps, isLoading, data } = this.props
      return <Component {...ownProps} isLoading={isLoading} data={data} />
    }
  }

  const mapStateToConnectorProps = (state: ReduxState, ownProps: any): any => {
    const connectorOptions = mapStateToOptions(state, ownProps)

    const entry = getEntry(state.readModels, {
      query: {
        name: connectorOptions.readModelName,
        resolver: connectorOptions.resolverName,
        args: connectorOptions.resolverArgs,
      },
    })
    const data =
      entry && entry.status === ResultStatus.Ready ? entry.data : null
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

  const mapDispatchToConnectorProps = (dispatch: Dispatch): any =>
    bindActionCreators(
      {
        connectReadModel: connectReadModelAction,
        disconnectReadModel: disconnectReadModelAction,
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
