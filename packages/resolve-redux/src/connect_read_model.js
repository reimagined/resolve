import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import actions from './actions'
import getAggregateActions from './get_aggregate_actions'

const readModelPropsNames = [
  'readModelName',
  'resolverName',
  'parameters',
  'isReactive'
]

const compareReadModelProps = (nextProps, prevProps) =>
  readModelPropsNames.reduce(
    (acc, key) =>
      acc && JSON.stringify(nextProps[key]) === JSON.stringify(prevProps[key]),
    true
  )

const extractReadModelProps = props =>
  readModelPropsNames.reduce((acc, key) => {
    acc[key] = props[key]
    return acc
  }, {})

const extractReadModelValues = props =>
  readModelPropsNames.map(key => props[key])

const connectReadModel = (
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

  class ReadModelConnector extends React.PureComponent {
    aggregateActions = getAggregateActions(this.context.store)

    componentWillReceiveProps(nextProps) {
      const readModelProps = extractReadModelProps(
        mapStateToProps(this.context.store.getState(), {
          ...nextProps,
          aggregateActions: this.aggregateActions
        })
      )

      if (compareReadModelProps(readModelProps, this)) return

      this.context.store.dispatch(
        actions.unsubscribeReadModel(this.readModelName, this.resolverName)
      )

      this.context.store.dispatch(
        actions.subscribeReadModel(...extractReadModelValues(readModelProps))
      )

      Object.assign(this, readModelProps)
    }

    componentDidMount() {
      const readModelProps = extractReadModelProps(
        mapStateToProps(this.context.store.getState(), {
          ...this.props,
          aggregateActions: this.aggregateActions
        })
      )

      this.context.store.dispatch(
        actions.subscribeReadModel(...extractReadModelValues(readModelProps))
      )

      Object.assign(this, readModelProps)
    }

    componentWillUnmount() {
      this.context.store.dispatch(
        actions.unsubscribeReadModel(this.readModelName, this.resolverName)
      )
    }

    render() {
      return (
        <ConnectedComponent
          {...this.props}
          aggregateActions={this.aggregateActions}
        />
      )
    }
  }

  ReadModelConnector.contextTypes = {
    store: PropTypes.object.isRequired
  }

  return ReadModelConnector
}

export default connectReadModel
