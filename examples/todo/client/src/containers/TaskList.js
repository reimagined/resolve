import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import TaskList from '../components/TaskList';

function getTaskList(cards, currentCardId) {
    const currentCard = cards[currentCardId];

    return currentCard
        ? (currentCard.todoList || {})
        : Object.keys(cards).reduce((result, key) =>
            Object.assign(result, cards[key].todoList)
        , {})
}

const mapStateToProps = ({ cards }, { match }) => {
    const cardId = match.params.cardId;

    return {
        title: (cardId && cards[cardId]) ? cards[cardId].name : 'All',
        tasks: getTaskList(cards, cardId)
    };
};

export default withRouter(connect(mapStateToProps)(TaskList));
