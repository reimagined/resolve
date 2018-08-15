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

import { connectViewModel } from '../resolve/resolve-redux'
import requiredAuth from '../decorators/requiredAuth'

export class ShoppingList extends React.PureComponent {
  render() {
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
          <Text>
            ShoppingList
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

export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    jwt: state.jwt,
    aggregateId
  }
}

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectViewModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(ShoppingList)
  )
)
