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

import requiredAuth from '../decorators/required-auth'
import { connectReadModel } from 'resolve-redux'
import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'
import * as refreshActions from '../redux/actions/refresh-actions'
import * as aggregateActions from '../redux/actions/aggregate-actions'

export class MyLists extends React.PureComponent {
  render() {
    const {
      lists,
      createShoppingList,
      removeShoppingList,
      navigation
    } = this.props

    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={navigation.openDrawer}>
              <Icon name="menu" ios="ios-menu" />
            </Button>
          </Left>
          <Body>
            <Title>My Lists</Title>
          </Body>
          <Right>
            <Button transparent onPress={this.props.refresh}>
              <Icon name="md-refresh" />
            </Button>
          </Right>
        </Header>
        <Content>
          <ShoppingLists
            lists={lists}
            navigate={navigation.navigate}
            removeShoppingList={removeShoppingList}
          />
        </Content>
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </Container>
    )
  }
}

export const mapStateToOptions = state => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {
    updatedAt: state.refresh.timestamp
  }
})

export const mapStateToProps = state => ({
  lists: state.optimisticShoppingLists
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      ...aggregateActions,
      ...refreshActions
    },
    dispatch
  )

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(MyLists)
  )
)
