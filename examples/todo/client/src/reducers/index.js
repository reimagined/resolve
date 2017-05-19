// TODO: use resolve-redux root path
import reducer from 'resolve-redux/dist/reducer';
import eventHandlers from './cards';

export default reducer({ name: 'cards', eventHandlers });
