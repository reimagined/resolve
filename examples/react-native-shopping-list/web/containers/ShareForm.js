import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { connectViewModel } from 'resolve-redux'
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import FindUsers from './FindUsers'
import requiredAuth from '../decorators/requiredAuth'

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
    const { optimisticSharings, shoppingList } = this.props

    return (
      <div className="example-wrapper">
        <ControlLabel>Shopping list name</ControlLabel>
        <Link to={`/${shoppingList.id}`}>
          <FormGroup bsSize="large">
            <FormControl
              type="text"
              value={shoppingList.name}
              onChange={() => {}}
            />
          </FormGroup>
        </Link>
        <ControlLabel>Find users</ControlLabel>
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
            shareId: shoppingList.id,
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
            shareId: shoppingList.id
          }}
          optimisticAddedSharings={optimisticSharings.share}
          optimisticRemovedSharings={optimisticSharings.unshare}
          onPressButton={this.unshareShoppingListForUser}
        />
      </div>
    )
  }
}

const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => ({
  optimisticSharings: state.optimisticSharings,
  shoppingList: ownProps.data
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectViewModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(ShareForm)
  )
)
