import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import TaskList from '../components/TaskList';
import { createTodoItem } from '../actions';

function getTaskList(cards, currentCardId) {
    const currentCard = cards[currentCardId];

    return currentCard
        ? currentCard.todoList || {}
        : Object.keys(cards).reduce(
              (result, key) => Object.assign(result, cards[key].todoList),
              {}
          );
}

const mapStateToProps = ({ cards }, { match }) => {
    const cardId = match.params.cardId;

    const isCardExist = cardId && cards.cards[cardId];
    const isIndexView = !cardId;

    return {
        doesExist: isIndexView || isCardExist,
        cardId,
        title: isCardExist ? cards.cards[cardId].name : 'All',
        tasks: getTaskList(cards.cards, cardId)
    };
};

function mapDispatchToProps(dispatch) {
    return {
        onTodoItemCreate: (name, cardId) => dispatch(createTodoItem(name, cardId))
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TaskList));
