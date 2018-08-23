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
import { connect} from "react-redux";
import { StyleSheet, View } from "react-native";

import requiredAuth from '../decorators/requiredAuth'

import FindUsers from "./FindUsers";

const styles = StyleSheet.create({
  input: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 5
  },
  label: {
    paddingLeft: 10,
    fontSize: 16,
    color: '#575757'
  }
})

export class ShareForm extends React.PureComponent {
  state = {
    query: ''
  }
  
  updateQuery = text => {
    this.setState({
      query: text
    })
  }
  
  render() {
    const { shoppingListId, shoppingListName } = this.props
    const { query } = this.state
    
    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={this.props.navigation.openDrawer}>
              <Icon name="menu" />
            </Button>
          </Left>
          <Body>
            <Title>Share</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
          <View>
            <Label style={styles.label}>Shopping list name:</Label>
            <Input
              style={styles.input}
              value={shoppingListName}
              disabled
            />
          </View>
          <Label style={styles.label}>Find users:</Label>
          <Input
            style={styles.input}
            value={query}
            onChangeText={this.updateQuery}
          />
          <FindUsers shoppingListId={shoppingListId} query={query} />
        </Content>
      </Container>
    )
  }
}

export const mapStateToProps = (
  state,
  {
    navigation: {
      state: {
        params: { id }
      }
    }
  }
) => ({
  shoppingListId: id,
  shoppingListName: state.optimisticSharings.name
})

export default requiredAuth(connect(mapStateToProps)(ShareForm))
