import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import actions from './actions'

const connectViewModel = mapStateToOptions => Component => {
  class ViewModelContainer extends React.PureComponent {
    componentDidMount() {
      // TODO placeholder
      const {
        viewModelName,
        aggregateIds,
        placeholder,
        placeholderTimeout
      } = this.props.connectorOptions

      this.props.connectViewModel(viewModelName, aggregateIds)
    }

    componentWillUnmount() {
      // TODO placeholder
      const {
        viewModelName,
        aggregateIds,
        placeholder,
        placeholderTimeout
      } = this.props.connectorOptions

      this.props.disconnectViewModel(viewModelName, aggregateIds)
    }

    render() {
      const { ownProps, isLoading, data } = this.props

      return <Component {...ownProps} isLoading={isLoading} data={data} />
    }
  }

  const mapStateToConnectorProps = (state, ownProps) => {
    const connectorOptions = mapStateToOptions(state, ownProps)

    const aggregateIdsKey = connectorOptions.aggregateIds.sort().join(',')

    const {
      viewModels: {
        [`resolve-loading-${
          connectorOptions.viewModelName
        }-${aggregateIdsKey}`]: isLoading,
        [connectorOptions.viewModelName]: { [aggregateIdsKey]: data }
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
        connectViewModel: actions.connectViewModel,
        disconnectViewModel: actions.disconnectViewModel
      },
      dispatch
    )

  const ViewModelConnector = connect(
    mapStateToConnectorProps,
    mapDispatchToConnectorProps
  )(ViewModelContainer)
  ViewModelConnector.mapStateToOptions = mapStateToOptions

  return ViewModelConnector
}

export default connectViewModel
