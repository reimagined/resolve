import React from 'react';

export default function(props) {
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-sm-3 col-md-2 sidebar">
                    <form>
                        <input
                            type="email"
                            className="form-control"
                            id="exampleInputEmail1"
                            placeholder="Add new group"
                        />
                    </form>
                    <ul className="nav nav-sidebar">
                        {props.children.map((child, index) => (
                            <li key={index}>
                                {child}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
