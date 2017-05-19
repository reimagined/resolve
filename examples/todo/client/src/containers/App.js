import { withRouter } from 'react-router-dom';

import { connect } from 'react-redux';
import App from '../components/App';
import { createTodoCard, removeTodoCard } from '../actions';

const mapStateToProps = (state, { match }) => {
    return {
        cards: state.cards,
        cardId: match.params.cardId
    };
};

function mapDispatchToProps(dispatch) {
    return {
        onCardAdd: name => dispatch(createTodoCard(name)),
        onCardRemove: id => dispatch(removeTodoCard(id))
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
