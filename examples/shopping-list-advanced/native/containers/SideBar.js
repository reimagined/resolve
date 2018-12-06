import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Text, Container, List, ListItem, Content, Icon } from 'native-base'
import { StyleSheet, Platform } from 'react-native'

import { Logo } from '@shopping-list-advanced/ui'
import { actions } from 'resolve-redux'

const styles = StyleSheet.create({
  content: {
    paddingTop: Platform.select({
      ios: 20,
      android: 0
    })
  },
  icon: {
    width: 30,
    marginRight: 2,
    textAlign: 'center'
  }
})

export class SideBar extends React.Component {
  routes = [
    {
      name: 'My Lists',
      icon: <Icon style={styles.icon} name="list" type="FontAwesome" />,
      callback: () => {
        this.props.navigation.navigate('My Lists')
      }
    },
    {
      name: 'Settings',
      icon: <Icon style={styles.icon} name="user" type="FontAwesome" />,
      callback: () => {
        this.props.navigation.navigate('Settings')
      }
    },
    {
      name: 'Logout',
      icon: <Icon style={styles.icon} name="sign-out" type="FontAwesome" />,
      callback: () => {
        this.props.logout()
        this.props.navigation.navigate('Logout')
      }
    }
  ]

  render() {
    const { jwt } = this.props

    if (!jwt.id) {
      return null
    }

    return (
      <Container>
        <Content padder style={styles.content}>
          <Logo />
          <List
            dataArray={this.routes}
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
