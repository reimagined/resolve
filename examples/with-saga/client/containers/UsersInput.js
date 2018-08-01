import React from 'react'

import { connectViewModel } from 'resolve-redux'

import {
  Alert,
  Form,
  FormGroup,
  FormControl,
  Button,
  ControlLabel
} from 'react-bootstrap'

const placeholder = 'example@example.com'

class UsersInput extends React.Component {
  render() {
    let newEmail
    let errors = this.props.data.errors || [{}]

    const handleClick = event => {
      event.preventDefault()
      this.props.submitUser(newEmail.value || placeholder)
      newEmail.value = ''
    }

    return (
      <div className="example-form-wrapper">
        {this.props.data.isError && (
          <Alert className="example-alert" bsStyle="danger">
            {errors[errors.length - 1].message}
          </Alert>
        )}

        <Form inline onSubmit={handleClick}>
          <FormGroup validationState={null}>
            <ControlLabel className="example-form-label">
              Enter email:
            </ControlLabel>
            {'  '}
            <FormControl
              className="example-form-input"
              type="email"
              inputRef={element => (newEmail = element)}
              placeholder={placeholder}
              onKeyPress={event => {
                if (event.charCode === 13) {
                  handleClick(event)
                }
              }}
            />
          </FormGroup>
          <Button
            type="submit"
            bsStyle="success"
            disabled={this.props.isDisabled}
          >
            Create user
          </Button>
        </Form>
      </div>
    )
  }
}

const mapStateToOptions = (_, { clientId }) => {
  return {
    viewModelName: 'error',
    aggregateIds: [clientId]
  }
}

export default connectViewModel(mapStateToOptions)(UsersInput)
