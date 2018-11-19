import { createAppContainer, createDrawerNavigator } from 'react-navigation'

import SideBar from './containers/SideBar'
import MyLists from './containers/MyLists'
import ShoppingList from './containers/ShoppingList'
import Settings from './containers/Settings'
import Login from './containers/Login'
import ShareForm from './containers/ShareForm'

const routes = createAppContainer(
  createDrawerNavigator(
    {
      'My Lists': { screen: MyLists },
      ShoppingList: { screen: ShoppingList },
      Settings: { screen: Settings },
      ShareForm: { screen: ShareForm },
      Login: { screen: Login }
    },
    {
      initialRouteName: 'My Lists',
      contentComponent: SideBar
    }
  )
)

export default routes
