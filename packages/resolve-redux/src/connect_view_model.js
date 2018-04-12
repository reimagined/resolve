import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import isLoadingViewModel from './is_loading_view_model'
import getAggregateActions from './get_aggregate_actions'

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

      this.viewModelName = viewModelName
      this.aggregateId = aggregateId

      this.context.store.dispatch(
        actions.subscribeViewmodel(this.viewModelName, this.aggregateId)
      )
    }

    componentWillReceiveProps(nextProps) {
      const { viewModelName, aggregateId } = mapStateToProps(
        this.context.store.getState(),
        nextProps
      )

      if (
        viewModelName !== this.viewModelName ||
        aggregateId !== this.aggregateId
      ) {
        this.context.store.dispatch(
          actions.unsubscribeViewmodel(this.viewModelName, this.aggregateId)
        )
        this.viewModelName = viewModelName
        this.aggregateId = aggregateId

        this.context.store.dispatch(
          actions.subscribeViewmodel(this.viewModelName, this.aggregateId)
        )
      }
    }

    componentWillUnmount() {
      this.context.store.dispatch(
        actions.unsubscribeViewmodel(this.viewModelName, this.aggregateId)
      )
    }

    render() {
      const loading = isLoadingViewModel(
        this.context.store,
        this.viewModelName,
        this.aggregateId
      )
      const aggregateActions = getAggregateActions(this.context.store)

      return (
        <ConnectedComponent
          {...this.props}
          loading={loading}
          aggregateActions={aggregateActions}
        />
      )
    }
  }

  ViewModelConnector.contextTypes = {
    store: PropTypes.object.isRequired
  }

  return ViewModelConnector
}
