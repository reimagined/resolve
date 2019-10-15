import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel, sendAggregateAction } from 'resolve-redux'
import { ControlLabel, FormControl } from 'react-bootstrap'

import requiredAuth from '../decorators/required-auth'

class Settings extends React.PureComponent {
  state = {
    username: this.props.username
  }

  updateInputText = event => {
    this.setState({
      username: event.target.value
    })
  }

  updateUserName = () => {
    this.props.updateUserName(this.props.id, {
      username: this.state.username
    })
  }

  onInputTextPressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.updateUserName()
    }
  }

  render() {
    const { id } = this.props

    return (
      <div className="example-wrapper">
        <ControlLabel>Username:</ControlLabel>
        <FormControl
          type="text"
          value={this.state.username}
          onChange={this.updateInputText}
          onKeyPress={this.onInputTextPressEnter}
          onBlur={this.updateUserName}
        />
        <br />
        <ControlLabel>User Id:</ControlLabel>
        <FormControl type="text" value={id} readOnly />
      </div>
    )
  }
}

export const mapStateToOptions = state => ({
  readModelName: 'ShoppingLists',
  resolverName: 'user',
  resolverArgs: {
    id: state.jwt.id
  }
})

export const mapStateToProps = (state, { data }) => ({
  id: data.id,
  username: data.username
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      createShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingList'
      ),
      renameShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'renameShoppingList'
      ),
      removeShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingList'
      ),
      createShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingItem'
      ),
      toggleShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'toggleShoppingItem'
      ),
      removeShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingItem'
      )
    },
    dispatch
  )

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(Settings)
  )
)
