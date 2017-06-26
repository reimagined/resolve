import React from 'react';
import Menu from './BurgerMenu';
import './Sidebar.css';

export default function (props) {
    let cardNameInput;

    return (
        <div>
            <Menu
                noOverlay={props.noOverlay}
                pageWrapId="page-wrap"
                outerContainerId="outer-container"
            >
                <ul className="nav nav-sidebar">
                    {props.children.map((child, index) =>
                        <li
                            id="sidebar-list"
                            key={index}
                            className={props.currentCard === child.key ? 'active' : null}
                        >
                            {child}
                        </li>
                    )}
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
                                onClick={() => {
                                    props.onCardAdd(cardNameInput.value);
                                    cardNameInput.value = '';
                                }}
                            >
                                Add
                            </button>
                        </span>
                    </div>
                </div>
            </Menu>
        </div>
    );
}
