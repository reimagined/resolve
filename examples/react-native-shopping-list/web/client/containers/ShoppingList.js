import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
import { bindActionCreators } from 'redux'
import { Redirect } from 'react-router-dom'
import {
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Checkbox,
  Button,
  FormControl,
  FormGroup,
  ControlLabel
} from 'react-bootstrap'

import Image from './Image'
import NotFound from '../components/NotFound'

export class ShoppingList extends React.PureComponent {
  state = {
    shoppingListName: this.props.data && this.props.data.name,
    itemText: ''
  }

  componentDidMount() {
    if (this.props.jwt.id && !this.props.match.params.id) {
      this.props.replaceUrl(`/${this.props.jwt.id}`)
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.data &&
      this.props.data.name !== (prevProps.data || {}).name
    ) {
      this.setState({
        shoppingListName: this.props.data.name
      })
    }
  }

  createItem = () => {
    this.props.createItem(this.props.aggregateId, {
      text: this.state.itemText,
      id: Date.now().toString()
    })

    this.setState({
      itemText: ''
    })
  }

  renameList = () => {
    this.props.renameList(this.props.aggregateId, {
      name: this.state.shoppingListName
    })
  }

  updateItemText = event => {
    this.setState({
      itemText: event.target.value
    })
  }

  onItemTextPressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.createItem()
    }
  }

  updateShoppingListName = event => {
    this.setState({
      shoppingListName: event.target.value
    })
  }

  onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.renameList()
    }
  }

  render() {
    const { data, jwt, aggregateId, toggleItem, removeItem } = this.props

    if (!jwt.id) {
      return <Redirect to="/login" />
    }

    if (data === null) {
      return <NotFound />
    }

    const { list } = data

    return (
      <div className="example-wrapper">
        <ControlLabel>Shopping list name</ControlLabel>
        <FormGroup bsSize="large">
          <FormControl
            type="text"
            value={this.state.shoppingListName}
            onChange={this.updateShoppingListName}
            onKeyPress={this.onShoppingListNamePressEnter}
            onBlur={this.renameList}
          />
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
        <ControlLabel>Item name</ControlLabel>
        <Row>
          <Col md={8}>
            <FormControl
              className="example-form-control"
              type="text"
              value={this.state.itemText}
              onChange={this.updateItemText}
              onKeyPress={this.onItemTextPressEnter}
            />
          </Col>
          <Col md={4}>
            <Button
              className="example-button"
              bsStyle="success"
              onClick={this.createItem}
            >
              Add Item
            </Button>
          </Col>
        </Row>
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
  const aggregateId = ownProps.match.params.id || state.jwt.id

  return {
    jwt: state.jwt,
    aggregateId
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
