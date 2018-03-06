import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import actions from './actions'

export default (mapStateToProps, mapDispatchToProps, mergeProps, options) => Component => {
  const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps, mergeProps, options)(
    Component
  )

  class ReadModelConnector extends React.PureComponent {
    componentWillReceiveProps(nextProps) {
      if (
        JSON.stringify(nextProps.variables) === JSON.stringify(this.variables) &&
        nextProps.readModelName === this.readModelName &&
        nextProps.resolverName === this.resolverName &&
        nextProps.isReactive === this.isReactive &&
        nextProps.query === this.query
      ) {
        return
      }

      this.context.store.dispatch(
        actions.unsubscribeReadmodel(this.readModelName, this.resolverName)
      )

      const { readModelName, resolverName, query, variables, isReactive } = mapStateToProps(
        this.context.store.getState(),
        this.props
      )

      this.context.store.dispatch(
        actions.subscribeReadmodel(readModelName, resolverName, query, variables, isReactive)
      )

      this.readModelName = readModelName
      this.resolverName = resolverName
      this.query = query
      this.variables = variables
      this.isReactive = isReactive
    }

    componentWillMount() {
      const { readModelName, resolverName, query, variables, isReactive } = mapStateToProps(
        this.context.store.getState(),
        this.props
      )

      this.context.store.dispatch(
        actions.subscribeReadmodel(readModelName, resolverName, query, variables, isReactive)
      )

      this.readModelName = readModelName
      this.resolverName = resolverName
      this.query = query
      this.variables = variables
      this.isReactive = isReactive
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
