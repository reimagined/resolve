import React from 'react';

export default function(props) {
    let cardNameInput;

    return (
        <div className={props.className}>
            <ul className="nav nav-sidebar">
                {props.children.map((child, index) => (
                    <li
                        key={index}
                        className={props.currentCard === child.key ? 'active': null }
                    >
                        {child}
                    </li>
                ))}
            </ul>
            <div className="row">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search for..."
                        ref={element => (cardNameInput = element)}
                    />
                    <span className="input-group-btn">
                        <button
                            className="btn btn-default"
                            type="button"
                            onClick={() => props.onCardAdd(cardNameInput.value)}
                        >
                            Add
                        </button>
                    </span>
                </div>
            </div>
        </div>
    );
}
