import React from 'react'
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Left,
  Right,
  Body,
  Icon
} from 'native-base'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { connectViewModel } from 'resolve-redux'
import requiredAuth from '../decorators/required-auth'
import ShoppingItemCreator from '../components/ShoppingItemCreator'
import ShoppingListPanel from '../components/ShoppingListPanel'
import ShoppingListItems from '../components/ShoppingListItems'
import NotFound from '../components/NotFound'

import * as aggregateActions from '../redux/actions/aggregate-actions'

export class ShoppingList extends React.PureComponent {
  componentDidMount() {
    this.optionalRedirect()
  }

  componentDidUpdate(prevProps) {
    if (this.props.data !== prevProps.data) {
      this.optionalRedirect()
    }
  }

  optionalRedirect = () => {
    if (this.props.data && this.props.data.removed) {
      this.props.navigation.navigate('My Lists')
    }
  }

  render() {
    const {
      isLoading,
      aggregateId,
      data,
      navigation,
      createShoppingItem,
      renameShoppingList,
      removeShoppingList,
      toggleShoppingItem,
      removeShoppingItem
    } = this.props

    if (isLoading !== false) {
      return null
    }

    if (data === null) {
      return <NotFound />
    }

    if (data.removed) {
      return null
    }

    return (
      <Container padder>
        <Header>
          <Left>
            <Button transparent onPress={this.props.navigation.openDrawer}>
              <Icon name="menu" />
            </Button>
          </Left>
          <Body>
            <Title>Shopping List</Title>
          </Body>
          <Right />
        </Header>
        <Content>
          <ShoppingListPanel
            renameShoppingList={renameShoppingList}
            removeShoppingList={removeShoppingList}
            navigate={navigation.navigate}
            aggregateId={aggregateId}
            name={data.name}
          />
          <ShoppingListItems
            aggregateId={aggregateId}
            items={data.list}
            toggleShoppingItem={toggleShoppingItem}
            removeShoppingItem={removeShoppingItem}
          />
        </Content>
        <ShoppingItemCreator
          aggregateId={aggregateId}
          createShoppingItem={createShoppingItem}
        />
      </Container>
    )
  }
}

export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.navigation.state.params.id

  return {
    viewModelName: 'shoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.navigation.state.params.id

  return {
    jwt: state.jwt,
    aggregateId
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectViewModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(ShoppingList)
  )
)
