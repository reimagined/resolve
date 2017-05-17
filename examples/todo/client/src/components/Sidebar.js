import React from 'react';

export default function(props) {
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
                    />
                    <span className="input-group-btn">
                        <button className="btn btn-default" type="button">Add</button>
                    </span>
                </div>
            </div>
        </div>
    );
}
