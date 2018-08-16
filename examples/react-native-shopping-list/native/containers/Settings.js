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

import { connectReadModel } from '../resolve/resolve-redux'
import requiredAuth from '../decorators/requiredAuth'

export class Settings extends React.PureComponent {
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
            Settings
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

export const mapStateToOptions = state => ({
  readModelName: 'Default',
  resolverName: 'user',
  resolverArgs: {
    id: state.jwt.id
  }
})

export const mapStateToProps = (state, { data }) => ({
  id: data.id,
  username: data.username
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(Settings)
  )
)
