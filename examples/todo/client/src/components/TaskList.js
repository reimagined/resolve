import React from 'react';
import { Redirect } from 'react-router-dom';
import TodoItem from './TodoItem';
import TodoTextInput from './TodoTextInput';

import './TaskList.css';
const PAGE_LIMIT = 10;

function TodoApp({ title, tasks, cardId, onTodoItemCreate, onTodoItemToggleCheck, onTodoItemRemove }) {
    return (
        <div className="todoapp">
            <h1 className="page-header">{title}</h1>
            {cardId &&
                <TodoTextInput
                    newTodo
                    onSave={name => onTodoItemCreate(name, cardId)}
                    placeholder="What needs to be done?"
                />}
            <ul className="todo-list">
                {Object.keys(tasks).map(key => (
                    <TodoItem
                        key={key}
                        todo={tasks[key]}
                        onCheck={() => onTodoItemToggleCheck(key)}
                        onRemove={() => onTodoItemRemove(key)}
                    />
                ))}
            </ul>
        </div>
    );
}

function NavigationButton({ navigateToHistory, url, condition, caption }) {
    return (
        <button
            onClick={() => navigateToHistory(url)}
            disabled={!condition}
            className="navigation-button"
        >
            {caption}
        </button>
    );
}

function TodoNavigation({ cardId, todoCount, pageNumber, navigateToHistory }) {
    const pageCount = (todoCount > 0) ? (Math.floor((todoCount - 1) / PAGE_LIMIT) + 1) : 0;

    return (
        <div className="todopages">
            <div>
                <NavigationButton
                    navigateToHistory={navigateToHistory}
                    url={`/${cardId}/${0}`}
                    condition={+pageNumber > 0}
                    caption="First"
                />
                <NavigationButton
                    navigateToHistory={navigateToHistory}
                    url={`/${cardId}/${+pageNumber - 1}`}
                    condition={+pageNumber > 0}
                    caption="Previous"
                />
                <span>Page {+pageNumber + 1} from {+pageCount}</span>
                <NavigationButton
                    navigateToHistory={navigateToHistory}
                    url={`/${cardId}/${+pageNumber + 1}`}
                    condition={+pageNumber < +pageCount - 1}
                    caption="Next"
                />
                <NavigationButton
                    navigateToHistory={navigateToHistory}
                    url={`/${cardId}/${+pageCount - 1}`}
                    condition={+pageNumber < +pageCount - 1}
                    caption="Last"
                />
            </div>
        </div>
    );
}

export default function (props) {
    const { firstCardId, cardId, doesExist, pageNumber, todoCount, matchOrSetFilter } = props;

    if (!firstCardId) {
        return (<div>No todo cards available</div>);
    } else if (!cardId || !doesExist) {
        return <Redirect to={`/${firstCardId}/0`} />;
    } else if (pageNumber === undefined) {
        return <Redirect to={`/${cardId}/0`} />;
    }

    matchOrSetFilter(`{
        cards (card: "${cardId}", from: ${pageNumber * PAGE_LIMIT}, limit: ${PAGE_LIMIT})
        mapTodoToCard(card: "${cardId}")
    }`);

    return (
        <div className="todobody">
            {(!props.tasks) ? (
                <span>Loading partial state for current todo card...</span>
            ): (
                <TodoApp {...props} />
            )}
            {(todoCount > 0) ? (
                <TodoNavigation {...props} />
            ) : (
                <div className="todopages">
                    <span>No pages</span>
                </div>
            )}
        </div>
    );
}
