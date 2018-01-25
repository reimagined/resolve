import React from 'react'
import {
  Component,
  Animated,
  Styles,
  View,
  Text,
  ScrollView,
  Button,
  TextInput
} from 'reactxp'
import { bindActionCreators } from 'redux'
import { connect } from 'resolve-redux'
import ToggleSwitch from './ToggleSwitch'

import actions from '../actions'

const viewModelName = 'Todos'
const aggregateId = 'root-id'

const styles = {
  scroll: Styles.createScrollViewStyle({
    alignSelf: 'stretch',
    backgroundColor: '#f5fcff'
  }),
  container: Styles.createViewStyle({
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  }),
  header: Styles.createTextStyle({
    fontSize: 32,
    marginBottom: 12
  }),
  listRow: Styles.createViewStyle({
    flexDirection: 'row',
    alignItems: 'center'
  }),
  todoIndex: Styles.createViewStyle({
    marginRight: 10
  }),
  todoText: Styles.createViewStyle({
    marginLeft: 20
  }),
  roundButton: Styles.createViewStyle({
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#7d88a9'
  }),
  removeButton: Styles.createViewStyle({
    marginLeft: 5,
    backgroundColor: '#ddd'
  }),
  buttonText: Styles.createViewStyle({
    fontSize: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    color: 'white'
  }),
  newTodoContainer: Styles.createViewStyle({
    flexDirection: 'row',
    alignItems: 'center'
  }),
  textInput: Styles.createTextInputStyle({
    borderWidth: 1,
    borderColor: 'gray',
    width: 100
  })
}

class App extends Component {
  constructor(props) {
    super(props)
    this._translationValue = Animated.createValue(-100)
    this._animatedStyle = Styles.createAnimatedTextStyle({
      transform: [
        {
          translateY: this._translationValue
        }
      ]
    })
    this.state = { newTodo: '' }
  }

  componentDidMount() {
    let animation = Animated.timing(this._translationValue, {
      toValue: 0,
      easing: Animated.Easing.OutBack(),
      duration: 500
    })

    animation.start()
  }

  render() {
    const {
      todos,
      createItem,
      toggleItem,
      removeItem,
      aggregateId
    } = this.props

    return (
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.header}>TODO</Text>
          <View style={styles.list}>
            {Object.keys(todos).map((id, index) => (
              <View key={id} style={styles.listRow}>
                <Text style={styles.todoIndex}>{`${index + 1}.`}</Text>
                <ToggleSwitch
                  value={todos[id].checked}
                  onChange={toggleItem.bind(null, aggregateId, { id })}
                />
                <Text style={styles.todoText}>{todos[id].text}</Text>
                <Button
                  style={styles.removeButton}
                  onPress={removeItem.bind(null, aggregateId, { id })}
                >
                  <Text>{' X '}</Text>
                </Button>
              </View>
            ))}
          </View>

          <View style={styles.newTodoContainer}>
            <Button
              style={styles.roundButton}
              onPress={() => {
                this.setState({ newTodo: '' })
                createItem(aggregateId, {
                  text: this.state.newTodo,
                  id: Date.now()
                })
              }}
            >
              <Text style={styles.buttonText}>Add Todo</Text>
            </Button>
            <TextInput
              style={styles.textInput}
              value={this.state.newTodo}
              onChangeText={newValue => this.setState({ newTodo: newValue })}
            />
          </View>
        </View>
      </ScrollView>
    )
  }
}

const mapStateToProps = state => ({
  viewModelName,
  aggregateId,
  todos: state[viewModelName][aggregateId]
})

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(App)
