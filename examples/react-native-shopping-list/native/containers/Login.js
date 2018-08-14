import React from 'react'
import {
  Container,
  Content,
  Button,
  H3,
  Text,
  Icon,
  Form,
  Input,
  Item,
  Label,
  View
} from 'native-base'
import { Image } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions } from '../resolve/resolve-redux'

import requiredNoAuth from '../decorators/requiredNoAuth'
import ResolveLogo from '../assets/resolve-logo.png'

export class Login extends React.PureComponent {
  state = {
    username: '',
    password: ''
  }

  onLogin = () => {
    this.props.authRequest('/auth/local/register', {
      username: this.state.username,
      password: this.state.password
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
        <Content
          padder
          contentContainerStyle={{ justifyContent: 'center', flex: 1 }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Image style={{ width: 35, height: 35 }} source={ResolveLogo} />
            <Text style={{ marginBottom: 30, marginLeft: 5, fontSize: 27 }}>
              Shopping List
            </Text>
          </View>
          <H3>Login Form</H3>
          <Form style={{ marginBottom: 20 }}>
            <Item stackedLabel>
              <Label>Username</Label>
              <Input
                value={this.state.username}
                onChangeText={this.updateUsername}
              />
            </Item>
            <Item stackedLabel>
              <Label>Password</Label>
              <Input
                value={this.state.password}
                onChangeText={this.updatePassword}
              />
            </Item>
          </Form>
          <View style={{ flexDirection: 'row' }}>
            <Button style={{ marginRight: 5 }} onPress={this.onLogin}>
              <Text>Login</Text>
            </Button>
            <Button success>
              <Text>Register</Text>
            </Button>
          </View>
          <H3 style={{ marginTop: 30 }}>Login with your social</H3>
          <Button style={{ marginTop: 10 }} block>
            <Icon style={{ marginRight: 0 }} name="google" type="FontAwesome" />
            <Text>Login with Google</Text>
          </Button>
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
