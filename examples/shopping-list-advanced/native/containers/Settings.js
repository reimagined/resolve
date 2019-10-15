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
  Icon,
  Label,
  Input
} from 'native-base'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { StyleSheet } from 'react-native'

import { connectReadModel } from 'resolve-redux'
import requiredAuth from '../decorators/required-auth'
import * as aggregateActions from '../redux/actions/aggregate-actions'

const styles = StyleSheet.create({
  label: {
    paddingLeft: 5,
    fontSize: 16,
    color: '#575757'
  },
  input: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 10
  }
})

export class Settings extends React.PureComponent {
  state = {}

  getText = () =>
    this.state.text != null ? this.state.text : this.props.data.username

  updateText = text => {
    this.setState({
      text
    })
  }

  updateUserName = () => {
    this.props.updateUserName(this.props.data.id, {
      username: this.getText()
    })
  }

  render() {
    const { isLoading, data } = this.props
    if (isLoading || data == null) {
      return null
    }

    const { id } = data
    const text = this.getText()

    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={this.props.navigation.openDrawer}>
              <Icon name="menu" />
            </Button>
          </Left>
          <Body>
            <Title>Settings</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
          <Label style={styles.label}>Username:</Label>
          <Input
            style={styles.input}
            value={text}
            onChangeText={this.updateText}
            onSubmitEditing={this.updateUserName}
            onBlur={this.updateUserName}
          />
          <Label style={styles.label}>User Id:</Label>
          <Input style={styles.input} value={id} multiline disabled />
        </Content>
      </Container>
    )
  }
}

export const mapStateToOptions = state => ({
  readModelName: 'ShoppingLists',
  resolverName: 'user',
  resolverArgs: {
    id: state.jwt.id
  }
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      null,
      mapDispatchToProps
    )(Settings)
  )
)
