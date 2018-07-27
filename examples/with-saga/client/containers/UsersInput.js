import React from 'react'

import { connectViewModel } from 'resolve-redux'
import { connect } from 'react-redux'

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
    let errors = this.props.errors || []
    let isError = this.props.error.isError

    const handleClick = event => {
      event.preventDefault()
      this.props.submitUser(newEmail.value || placeholder)
      newEmail.value = ''
    }

    return (
      <div className="example-form-wrapper">
        {isError && (
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

const mapStateToOptions = () => ({
  viewModelName: 'error',
  aggregateIds: '*'
})

const mapStateToProps = ({ error }) => ({ error })

export default connectViewModel(mapStateToOptions)(
  connect(mapStateToProps)(UsersInput)
)
