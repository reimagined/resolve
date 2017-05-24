import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import App from '../components/App';
import { createTodoCard, removeTodoCard, createTodoItem } from '../actions';
import { action as toggleMenu } from 'redux-burger-menu';

const mapStateToProps = (state, { match }) => {
    return {
        cards: state.cards.cards,
        cardId: match.params.cardId || null
    };
};

function mapDispatchToProps(dispatch) {
    return {
        onCardAdd: name => dispatch(createTodoCard(name)),
        onCardRemove: id => dispatch(removeTodoCard(id)),
        onTodoItemCreate: (name, cardId) => dispatch(createTodoItem(name, cardId)),
        toggleMenu: isOpen => dispatch(toggleMenu(isOpen))
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
