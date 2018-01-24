import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import isLoadingViewModel from './is_loading_view_model'

import actions from './actions'

export default (
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
  options
) => Component => {
  const ConnectedComponent = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    options
  )(Component)

  class ViewModelConnector extends React.PureComponent {
    componentWillMount() {
      const { viewModelName, aggregateId } = mapStateToProps(
        this.context.store.getState(),
        this.props
      )

      this.context.store.dispatch(actions.subscribe(viewModelName, aggregateId))

      this.viewModelName = viewModelName
      this.aggregateId = aggregateId
    }

    componentWillUnmount() {
      this.context.store.dispatch(
        actions.unsubscribe(this.viewModelName, this.aggregateId)
      )
    }

    render() {
      const loading = isLoadingViewModel(
        this.context.store,
        this.viewModelName,
        this.aggregateId
      )

      return <ConnectedComponent {...this.props} loading={loading} />
    }
  }

  ViewModelConnector.contextTypes = {
    store: PropTypes.object.isRequired
  }

  return ViewModelConnector
}
