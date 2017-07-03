import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { actions } from 'resolve-redux';

import TaskList from '../components/TaskList';
import { createTodoItem, removeTodoItem, toggleTodoItem } from '../actions';

const mapStateToProps = ({ cards }, { match, history }) => {
    const cardIds = Object.keys(cards.cards);
    const firstCardId = (cardIds.length > 0) ? cardIds[0] : null;
    const cardId = match.params.cardId;
    const pageNumber = match.params.pageNumber;
    const doesExist = cardId && cards.cards[cardId];
    const navigateToHistory = url => history.push(url);

    return {
        title: doesExist ? cards.cards[cardId].name : '',
        tasks: doesExist ? cards.cards[cardId].todoList : null,
        todoCount: doesExist ? cards.cards[cardId].todoCount : null,
        navigateToHistory,
        pageNumber,
        firstCardId,
        doesExist,
        cardId
    };
};

function mapDispatchToProps(dispatch) {
    return {
        onTodoItemCreate: (name, cardId) => dispatch(createTodoItem(name, cardId)),
        onTodoItemRemove: id => dispatch(removeTodoItem(id)),
        onTodoItemToggleCheck: id => dispatch(toggleTodoItem(id)),
        matchOrSetFilter: filter => dispatch(actions.setProjectionFiltering('cards', filter))
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TaskList));
