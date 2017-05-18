import { withRouter } from 'react-router-dom';

import { connect } from 'react-redux';
import App from '../components/App';
import { TodoCardCreate } from '../actions/cards';

const mapStateToProps = (state, { match }) => {
    return {
        cards: state.cards,
        cardId: match.params.cardId
    };
};

function mapDispatchToProps(dispatch) {
    return {
        onCardAdd: name => dispatch(TodoCardCreate(name))
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
