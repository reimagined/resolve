import React from 'react'
import { Text, Container, List, ListItem, Content } from 'native-base'

const routes = ['My Lists', 'Settings', 'Logout']

export class SideBar extends React.Component {
  render() {
    const { navigation } = this.props

    return (
      <Container>
        <Content>
          <List
            dataArray={routes}
            renderRow={data => {
              return (
                <ListItem button onPress={() => navigation.navigate(data)}>
                  <Text>{data}</Text>
                </ListItem>
              )
            }}
          />
        </Content>
      </Container>
    )
  }
}

export default SideBar
