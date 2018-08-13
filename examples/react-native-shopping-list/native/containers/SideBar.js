import React from 'react'
import { connect } from 'react-redux'
import { Text, Container, List, ListItem, Content } from 'native-base'

const routes = ['My Lists', 'Settings', 'Logout']

export class SideBar extends React.Component {
  render() {
    const { navigation, jwt } = this.props

    console.log(jwt)

    // if (!jwt.id) {
    //   return null
    // }

    return (
      <Container>
        <Content>
          <List
            dataArray={routes}
            renderRow={route => {
              return (
                <ListItem
                  button
                  onPress={navigation.navigate.bind(null, route)}
                >
                  <Text>{route}</Text>
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

export default connect(mapStateToProps)(SideBar)
