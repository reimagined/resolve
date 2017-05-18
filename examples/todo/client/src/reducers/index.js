import { combineReducers } from 'redux';

import cards from './cards';
import { reducer as burgerMenu } from 'redux-burger-menu';

export default combineReducers({
    cards,
    burgerMenu
});
