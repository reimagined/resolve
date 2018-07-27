import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { connectViewModel } from '../../resolve/resolve-redux'

import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Button,
  TextInput,
  Keyboard,
  Platform
} from 'react-native'

const isAndroid = Platform.OS == "android";
const viewPadding = 10;

const viewModelName = 'Todos'
const aggregateId = 'root-id'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: viewPadding,
    paddingTop: 30
  },
  list: {
    width: "100%"
  },
  listItem: {
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 18
  },
  hr: {
    height: 1,
    backgroundColor: "gray"
  },
  listItemCont: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  textInput: {
    height: 40,
    paddingRight: 10,
    paddingLeft: 10,
    borderColor: "gray",
    borderWidth: isAndroid ? 0 : 1,
    width: "100%"
  }
});

class Item extends React.PureComponent {
  render() {
    const { checked, text, removeItem, toggleItem } = this.props
    
    return (
      <View>
        <View style={styles.listItemCont}>
          <Text style={styles.listItem} onPress={toggleItem}>
            {`${checked ? 'yes' : 'no'}/${text}`}
          </Text>
          <Button title="X" onPress={removeItem} />
        </View>
        <View style={styles.hr} />
      </View>
    );
  }
}

export class Todos extends React.PureComponent {
  state = {
    text: ''
  }
  
  updateText = text => {
    this.setState({ text: text });
  };
  
  componentDidMount() {
    Keyboard.addListener(
      isAndroid ? "keyboardDidShow" : "keyboardWillShow",
      e => this.setState({ viewPadding: e.endCoordinates.height + viewPadding })
    );
    
    Keyboard.addListener(
      isAndroid ? "keyboardDidHide" : "keyboardWillHide",
      () => this.setState({ viewPadding: viewPadding })
    );
  }
  
  createItem = (id) => {
    const text = this.state;
    
    this.props.createItem(aggregateId, { id, text })
  };
  
  removeItem = (id) => {
    this.props.removeItem(aggregateId, { id })
  };
  
  toggleItem = (id) => {
    this.props.toggleItem(aggregateId, { id })
  };
  
  keyExtractor = (item) => item.id;
  
  renderItem = ({ item: { checked, text, id } }) => (
    <Item
      checked={checked}
      text={text}
      removeItem={this.removeItem.bind(this, id)}
      toggleItem={this.toggleItem.bind(this, id)}
    />
  );
  
  render() {
    return (
      <View
        style={[styles.container, { paddingBottom: this.state.viewPadding }]}
      >
        <FlatList
          style={styles.list}
          data={this.props.todos}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
        />
        <TextInput
          style={styles.textInput}
          onChangeText={this.updateText}
          onSubmitEditing={this.createItem}
          value={this.state.text}
          placeholder="Add Tasks"
          returnKeyType="done"
          returnKeyLabel="done"
        />
      </View>
    )
  }
}



const mapStateToOptions = () => ({
  viewModelName,
  aggregateIds: [aggregateId]
})

const mapStateToProps = (state, { data }) => ({
  todos: data
})

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Todos)
)
