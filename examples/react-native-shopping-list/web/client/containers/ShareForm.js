import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { connectResolveAdvanced } from 'resolve-redux'

import FindUsers from './FindUsers'
import { ControlLabel, FormControl } from 'react-bootstrap'

class ShareForm extends React.PureComponent {
  state = {
    query: ''
  }

  shareShoppingListForUser = userId => {
    const shoppingListId = this.props.match.params.id

    this.props.shareShoppingListForUser(shoppingListId, { userId })
  }

  updateQuery = event => {
    this.setState({
      query: event.target.value
    })
  }

  render() {
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
          query={this.state.query}
          onShareForUser={this.shareShoppingListForUser}
        />
        <ControlLabel>Already shared for users</ControlLabel>
      </div>
    )
  }
}

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectResolveAdvanced(
  connect(
    null,
    mapDispatchToProps
  )(ShareForm)
)
