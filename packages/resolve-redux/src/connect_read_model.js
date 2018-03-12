import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import actions from './actions'

const readModelPropsNames = ['readModelName', 'resolverName', 'query', 'variables', 'isReactive']

const compareReadModelProps = (nextProps, prevProps) =>
  readModelPropsNames.reduce(
    (acc, key) => acc && JSON.stringify(nextProps[key]) === JSON.stringify(prevProps[key]),
    true
  )

const extractReadModelProps = props =>
  readModelPropsNames.reduce((acc, key) => {
    acc[key] = props[key]
    return acc
  }, {})

const extractReadModelValues = props => readModelPropsNames.map(key => props[key])

export default (mapStateToProps, mapDispatchToProps, mergeProps, options) => Component => {
  const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps, mergeProps, options)(
    Component
  )

  class ReadModelConnector extends React.PureComponent {
    componentWillReceiveProps(nextProps) {
      if (!compareReadModelProps(nextProps, this)) return

      this.context.store.dispatch(
        actions.unsubscribeReadmodel(this.readModelName, this.resolverName)
      )

      const readModelProps = extractReadModelProps(
        mapStateToProps(this.context.store.getState(), nextProps)
      )

      this.context.store.dispatch(
        actions.subscribeReadmodel(...extractReadModelValues(readModelProps))
      )

      Object.assign(this, readModelProps)
    }

    componentWillMount() {
      const readModelProps = extractReadModelProps(
        mapStateToProps(this.context.store.getState(), this.props)
      )

      this.context.store.dispatch(
        actions.subscribeReadmodel(...extractReadModelValues(readModelProps))
      )

      Object.assign(this, readModelProps)
    }

    componentWillUnmount() {
      this.context.store.dispatch(
        actions.unsubscribeReadmodel(this.readModelName, this.resolverName)
      )
    }

    render() {
      return <ConnectedComponent {...this.props} />
    }
  }

  ReadModelConnector.contextTypes = {
    store: PropTypes.object.isRequired
  }

  return ReadModelConnector
}
