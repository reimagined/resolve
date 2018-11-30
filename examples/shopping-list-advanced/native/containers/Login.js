import React from 'react'
import {
  Container,
  Content,
  Button,
  H3,
  Text,
  Form,
  Input,
  Item,
  Label,
  View
} from 'native-base'
import { StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { actions } from 'resolve-redux'
import requiredNoAuth from '../decorators/required-no-auth'
import { Logo } from '@shopping-list-advanced/ui'

const styles = StyleSheet.create({
  contentContainer: {
    justifyContent: 'center',
    flex: 1
  },
  form: {
    marginBottom: 20
  },
  buttonContainer: {
    flexDirection: 'row'
  },
  button: {
    marginRight: 5
  },
  socialTitle: {
    marginTop: 30
  },
  socialButton: {
    marginTop: 10
  },
  socialButtonIcon: {
    marginRight: 0
  }
})

export class Login extends React.PureComponent {
  state = {
    username: '',
    password: ''
  }

  onLogin = () => {
    this.props.authRequest('/api/auth/local/login', {
      username: this.state.username,
      password: this.state.password,
      noredirect: true
    })
  }

  onRegister = () => {
    this.props.authRequest('/api/auth/local/register', {
      username: this.state.username,
      password: this.state.password,
      noredirect: true
    })
  }

  updateUsername = username => {
    this.setState({
      username
    })
  }

  updatePassword = password => {
    this.setState({
      password
    })
  }

  render() {
    return (
      <Container>
        <Content padder contentContainerStyle={styles.contentContainer}>
          <Logo />
          <H3>Login Form</H3>
          <Form style={styles.form}>
            <Item stackedLabel>
              <Label>Username:</Label>
              <Input
                value={this.state.username}
                onChangeText={this.updateUsername}
              />
            </Item>
            <Item stackedLabel>
              <Label>Password:</Label>
              <Input
                secureTextEntry
                value={this.state.password}
                onChangeText={this.updatePassword}
              />
            </Item>
          </Form>
          <View style={styles.buttonContainer}>
            <Button style={styles.button} onPress={this.onLogin}>
              <Text>Login</Text>
            </Button>
            <Button style={styles.button} onPress={this.onRegister} success>
              <Text>Register</Text>
            </Button>
          </View>
        </Content>
      </Container>
    )
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(actions, dispatch)

export default requiredNoAuth(
  connect(
    null,
    mapDispatchToProps
  )(Login)
)
