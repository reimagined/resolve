import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import App from '../components/App';
import { createTodoCard, removeTodoCard } from '../actions';
import { action as toggleMenu } from 'redux-burger-menu';

const mapStateToProps = (state, { match }) => {
    return {
        cards: state.cards.cards,
        cardId: match.params.cardId
    };
};

function mapDispatchToProps(dispatch) {
    return {
        onCardAdd: name => dispatch(createTodoCard(name)),
        onCardRemove: id => dispatch(removeTodoCard(id)),
        toggleMenu: isOpen => dispatch(toggleMenu(isOpen))
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
