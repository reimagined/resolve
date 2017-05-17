import { withRouter } from 'react-router-dom';

import { connect } from 'react-redux';
import App from '../components/App';

const mapStateToProps = (state, { match }) => {
    return {
        cards: state.cards,
        cardId: match.params.cardId
    };
};

export default withRouter(connect(mapStateToProps)(App));
