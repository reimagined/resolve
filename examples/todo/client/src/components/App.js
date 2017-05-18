import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function(props) {
    const links = Object.keys(props.cards).map(key => (
        <Link key={key} to={`/${key}`}>{props.cards[key].name}</Link>
    ));

    return (
        <div className="App">
            <Navbar title="Todo Example">
                {links}
            </Navbar>
            <div className="container-fluid">
                <div className="row">
                    <Sidebar
                        currentCard={props.cardId}
                        className="col-sm-3 col-md-2 sidebar"
                        onCardAdd={props.onCardAdd}
                    >
                        {links}
                    </Sidebar>

                    <div className="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main">
                        {props.children}
                    </div>
                </div>
            </div>
        </div>
    );
}
