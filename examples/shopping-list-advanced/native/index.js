import { AppLoading, registerRootComponent } from 'expo'
import * as Font from 'expo-font'
import React from 'react'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import { Ionicons } from '@expo/vector-icons'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { NavigationContainer } from '@react-navigation/native'

import getNativeChunk from './native-chunk'
import origin from './constants/origin'
import getStore from './redux/store'

import SideBar from './containers/SideBar'
import MyLists from './containers/MyLists'
import ShoppingList from './containers/ShoppingList'
import Settings from './containers/Settings'
import Login from './containers/Login'
import ShareForm from './containers/ShareForm'

const {
  rootPath,
  staticPath,
  resolveRedux: { Providers },
} = getNativeChunk()

const Drawer = createDrawerNavigator()

const store = getStore()

class AppContainer extends React.PureComponent {
  state = {
    isReady: false,
  }

  async componentDidMount() {
    await Font.loadAsync({
      Roboto: require('native-base/Fonts/Roboto.ttf'),
      Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
      ...Ionicons.font,
    })

    this.setState({
      isReady: true,
    })
  }

  getDrawerContent = (props) => <SideBar {...props} />

  render() {
    if (!this.state.isReady) {
      return <AppLoading />
    }

    return (
      <Providers
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        store={store}
      >
        <ActionSheetProvider>
          <Providers
            origin={origin}
            rootPath={rootPath}
            staticPath={staticPath}
            store={store}
          >
            <NavigationContainer>
              <Drawer.Navigator
                initialRouteName="My Lists"
                drawerContent={this.getDrawerContent}
              >
                <Drawer.Screen name="My Lists" component={MyLists} />
                <Drawer.Screen name="ShoppingList" component={ShoppingList} />
                <Drawer.Screen name="Settings" component={Settings} />
                <Drawer.Screen name="ShareForm" component={ShareForm} />
                <Drawer.Screen name="Login" component={Login} />
              </Drawer.Navigator>
            </NavigationContainer>
          </Providers>
        </ActionSheetProvider>
      </Providers>
    )
  }
}

registerRootComponent(AppContainer)
