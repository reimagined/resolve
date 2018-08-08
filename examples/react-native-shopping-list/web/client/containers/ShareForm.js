import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { connectResolveAdvanced } from 'resolve-redux'
import { ControlLabel, FormControl } from 'react-bootstrap'

import FindUsers from './FindUsers'

class ShareForm extends React.PureComponent {
  state = {
    query: ''
  }

  shareShoppingListForUser = (userId, username) => {
    const shoppingListId = this.props.match.params.id

    this.props.shareShoppingListForUser(shoppingListId, { userId, username })
  }

  unshareShoppingListForUser = (userId, username) => {
    const shoppingListId = this.props.match.params.id

    this.props.unshareShoppingListForUser(shoppingListId, { userId, username })
  }

  updateQuery = event => {
    this.setState({
      query: event.target.value
    })
  }

  render() {
    const {
      match: {
        params: { id: shareId }
      },
      optimisticSharings
    } = this.props

    return (
      <div className="example-wrapper">
        <ControlLabel>Find</ControlLabel>
        <FormControl
          className="example-form-control"
          type="text"
          value={this.state.query}
          onChange={this.updateQuery}
        />
        <FindUsers
          buttonText="Share"
          buttonBaseStyle="success"
          options={{
            shareId,
            query: this.state.query
          }}
          optimisticAddedSharings={optimisticSharings.unshare}
          optimisticRemovedSharings={optimisticSharings.share}
          onPressButton={this.shareShoppingListForUser}
        />
        <ControlLabel>Already shared for users</ControlLabel>
        <FindUsers
          buttonText="Unshare"
          buttonBaseStyle="success"
          options={{
            shareId
          }}
          optimisticAddedSharings={optimisticSharings.share}
          optimisticRemovedSharings={optimisticSharings.unshare}
          onPressButton={this.unshareShoppingListForUser}
        />
      </div>
    )
  }
}

export const mapStateToProps = state => ({
  optimisticSharings: state.optimisticSharings
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectResolveAdvanced(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShareForm)
)
