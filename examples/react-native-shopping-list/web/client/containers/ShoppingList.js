import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
import { bindActionCreators } from 'redux'
import { Redirect } from 'react-router-dom'
import {
  Grid,
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Checkbox,
  Form,
  Button,
  FormControl,
  FormGroup
} from 'react-bootstrap'

import Image from './Image'

export class ShoppingList extends React.PureComponent {
  componentDidMount() {
    if (this.props.jwt.id && !this.props.match.params.id) {
      this.props.replaceUrl(`/${this.props.jwt.id}`)
    }
  }

  render() {
    const {
      name,
      list,
      jwt,
      aggregateId,
      createItem,
      toggleItem,
      removeItem
    } = this.props

    const placeholder = 'New Task'
    const createItemFunc = () => {
      createItem(aggregateId, {
        text: newTodo.value === '' ? placeholder : newTodo.value,
        id: Date.now()
      })
      newTodo.value = ''
    }

    let newTodo

    if (!jwt.id) {
      return <Redirect to="/login" />
    }

    return (
      <div className="example-wrapper">
        <FormGroup bsSize="large">
          <FormControl type="text" defaultValue={name} />
        </FormGroup>
        <ListGroup className="example-list">
          {list.map(todo => (
            <ListGroupItem key={todo.id}>
              <Checkbox
                inline
                checked={todo.checked}
                onChange={toggleItem.bind(null, aggregateId, { id: todo.id })}
              >
                {todo.text}
              </Checkbox>
              <Image
                className="example-close-button"
                src="/close-button.png"
                onClick={removeItem.bind(null, aggregateId, { id: todo.id })}
              />
            </ListGroupItem>
          ))}
        </ListGroup>

        <Form inline className="example-form">
          <Row className="show-grid">
            <Col md={8}>
              <FormControl
                className="example-form-control"
                type="text"
                placeholder={placeholder}
                inputRef={element => (newTodo = element)}
                onKeyPress={event => {
                  if (event.charCode === 13) {
                    event.preventDefault()
                    createItemFunc()
                  }
                }}
              />
            </Col>
            <Col md={4}>
              <Button
                className="example-button"
                bsStyle="success"
                onClick={() => {
                  createItemFunc()
                }}
              >
                Add Item
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    )
  }
}

const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id || state.jwt.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    aggregateId: state.jwt.id,
    name: ownProps.data.name,
    list: ownProps.data.list,
    jwt: state.jwt
  }
}

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      ...aggregateActions,
      replaceUrl: routerActions.replace
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShoppingList)
)
