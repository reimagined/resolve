import React from 'react'
import { connect } from 'react-redux'
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import FindUsers from './FindUsers'
import requiredAuth from '../decorators/required-auth'

class ShareForm extends React.PureComponent {
  state = {
    query: ''
  }

  updateQuery = event => {
    this.setState({
      query: event.target.value
    })
  }

  render() {
    const { shoppingListId, shoppingListName } = this.props
    const { query } = this.state

    return (
      <div className="example-wrapper">
        <ControlLabel>Shopping list name:</ControlLabel>
        <Link to={`/${shoppingListId}`}>
          <FormGroup bsSize="large">
            <FormControl
              type="text"
              value={shoppingListName}
              onChange={() => {}}
            />
          </FormGroup>
        </Link>
        <ControlLabel>Find users:</ControlLabel>
        <FormControl
          className="example-form-control"
          type="text"
          value={query}
          onChange={this.updateQuery}
        />
        <FindUsers shoppingListId={shoppingListId} query={query} />
      </div>
    )
  }
}

export const mapStateToProps = (
  state,
  {
    match: {
      params: { id }
    }
  }
) => ({
  shoppingListId: id,
  shoppingListName: state.optimisticSharings.name
})

export default requiredAuth(connect(mapStateToProps)(ShareForm))
