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

export class MyLists extends React.PureComponent {
  render() {
    return (
      <Container>
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
          <Text>
            MyLists
            {JSON.stringify(this.props)}
          </Text>
        </Content>
        <Footer>
          <FooterTab>
            <Button full>
              <Text>Footer</Text>
            </Button>
          </FooterTab>
        </Footer>
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
