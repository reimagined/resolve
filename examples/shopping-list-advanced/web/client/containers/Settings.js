import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { ControlLabel, FormControl } from 'react-bootstrap'

import requiredAuth from '../decorators/required-auth'
import * as aggregateActions from '../redux/aggregate-actions'

class Settings extends React.PureComponent {
  state = {}

  getText = () =>
    this.state.text != null ? this.state.text : this.props.data.username

  updateInputText = event => {
    this.setState({
      text: event.target.value
    })
  }

  updateUserName = () => {
    this.props.updateUserName(this.props.data.id, {
      username: this.getText()
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

    const { id } = data
    const text = this.getText()

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
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      null,
      mapDispatchToProps
    )(Settings)
  )
)
