import React from 'react'

import Form from '../containers/Form'
import Image from '../containers/Image'

class LogoutButton extends React.PureComponent {
  state = {
    isFirstRender: true
  }

  componentDidMount() {
    this.setState({
      isFirstRender: false
    })
  }

  onLogoutClick = event => {
    this.form.submit()
    event.stopPropagation()
    return false
  }

  formRef = element => {
    this.form = element
  }

  render() {
    if (this.state.isFirstRender) {
      return null
    }

    return (
      <Form
        method="POST"
        action="/api/auth/local/logout"
        innerRef={this.formRef}
      >
        <input type="text" name="username" readOnly value="hidden" hidden />
        <input type="text" name="password" readOnly value="hidden" hidden />
        <a className="logout" href="/login" onClick={this.onLogoutClick}>
          <Image className="example-icon" src="/logout.svg" /> Logout
        </a>
      </Form>
    )
  }
}

export default LogoutButton
