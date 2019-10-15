import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel, sendAggregateAction } from 'resolve-redux'
import { ControlLabel, FormControl } from 'react-bootstrap'

import requiredAuth from '../decorators/required-auth'

class Settings extends React.PureComponent {
  state = {}
  updateInputText = event => {
    this.setState({
      text: event.target.value
    })
  }

  updateUserName = () => {
    this.props.updateUserName(this.props.data.id, {
      username: this.state.text
    })
  }

  onInputTextPressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.updateUserName()
    }
  }

  render() {
    const { isLoading, data } = this.props
    if (isLoading || data == null) {
      return null
    }

    const { id, username } = data
    let { text } = this.state

    if (text == null) {
      this.updateInputText({ target: { value: username } })
      text = username
    }

    return (
      <div className="example-wrapper">
        <ControlLabel>Username:</ControlLabel>
        <FormControl
          type="text"
          value={text}
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

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      updateUserName: sendAggregateAction.bind(null, 'User', 'updateUserName')
    },
    dispatch
  )

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      null,
      mapDispatchToProps
    )(Settings)
  )
)
