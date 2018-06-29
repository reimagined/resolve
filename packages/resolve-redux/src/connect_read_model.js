import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import actions from './actions'
import { connectorMetaMap } from './constants'
import getHash from "./get_hash";

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
  
      // TODO
      if (isLoading !== false) {
        return null
      }
  
  
      return <Component {...ownProps} isLoading={isLoading} data={data} />
    }
  }

  const mapStateToConnectorProps = (state, ownProps) => {
    const connectorOptions = mapStateToOptions(state, ownProps)
  
    const readModelName = connectorOptions.readModelName
    const resolverName = getHash(connectorOptions.resolverName)
    const resolverArgs = getHash(connectorOptions.resolverArgs)
    
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

  return ReadModelConnector
}

export default connectReadModel
