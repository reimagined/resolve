import React from 'react'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import uuid from 'uuid'

import {
  Form,
  FormGroup,
  FormControl,
  Button,
  ControlLabel
} from 'react-bootstrap'

const UsersInput = () => (
  <div className="example-form-wrapper">
    <Form inline onSubmit={() => {}}>
      <FormGroup validationState={null}>
        <ControlLabel className="example-form-label">Enter email:</ControlLabel>
        {'  '}
        <FormControl
          className="example-form-input"
          type="email"
          placeholder="example@example.com"
          onKeyPress={event => {
            if (event.charCode === 13) {
            }
          }}
        />
      </FormGroup>
      <Button type="submit" bsStyle="success">
        Create user
      </Button>
    </Form>
  </div>
)

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      createUser: ({ email }) => {
        aggregateActions.createUser(uuid.v4(), { email })
      }
    },
    dispatch
  )

export default connect(
  null,
  mapDispatchToProps
)(UsersInput)
