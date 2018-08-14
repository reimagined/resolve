import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Text, Container, List, ListItem, Content, Icon } from 'native-base'

import { actions } from '../resolve/resolve-redux'

export class SideBar extends React.Component {
  render() {
    const { navigation, jwt, logout } = this.props

    const routes = [
      {
        name: 'My Lists',
        icon: (
          <Icon
            style={{ width: 30, marginRight: 2, textAlign: 'center' }}
            name="list"
            type="FontAwesome"
          />
        ),
        callback: () => {
          navigation.navigate('My Lists')
        }
      },
      {
        name: 'Settings',
        icon: (
          <Icon
            style={{ width: 30, marginRight: 2, textAlign: 'center' }}
            name="user"
            type="FontAwesome"
          />
        ),
        callback: () => {
          navigation.navigate('Settings')
        }
      },
      {
        name: 'Logout',
        icon: (
          <Icon
            style={{ width: 30, marginRight: 2, textAlign: 'center' }}
            name="sign-out"
            type="FontAwesome"
          />
        ),
        callback: () => {
          logout()
          navigation.navigate('Logout')
        }
      }
    ]

    if (!jwt.id) {
      return null
    }

    return (
      <Container>
        <Content>
          <List
            dataArray={routes}
            renderRow={route => {
              return (
                <ListItem button onPress={route.callback}>
                  {route.icon}
                  <Text>{route.name}</Text>
                </ListItem>
              )
            }}
          />
        </Content>
      </Container>
    )
  }
}

export const mapStateToProps = state => {
  return {
    jwt: state.jwt
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(actions, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SideBar)
