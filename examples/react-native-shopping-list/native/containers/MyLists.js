import React from 'react'
import {
  Container,
  Header,
  Title,
  Content,
  Footer,
  FooterTab,
  Button,
  Left,
  Right,
  Body,
  Icon,
  Text
} from 'native-base'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import requiredAuth from '../decorators/requiredAuth'
import { connectReadModel } from '../resolve/resolve-redux'
import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'

export class MyLists extends React.PureComponent {
  render() {
    const { lists, createShoppingList, navigation } = this.props

    console.log(navigation)

    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={navigation.openDrawer}>
              <Icon name="menu" />
            </Button>
          </Left>
          <Body>
            <Title>My Lists</Title>
          </Body>
          <Right />
        </Header>
        <Content>
          <ShoppingLists lists={lists} navigate={navigation.navigate} />
        </Content>
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </Container>
    )
  }
}

export const mapStateToOptions = () => ({
  readModelName: 'Default',
  resolverName: 'shoppingLists',
  resolverArgs: {}
})

export const mapStateToProps = (state, { data }) => ({
  lists: [...data, ...state.optimisticShoppingLists]
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(MyLists)
  )
)
