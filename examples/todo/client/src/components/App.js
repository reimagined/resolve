import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Media from 'react-media';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import Sidebar from './Sidebar';

export default class App extends Component {
    render() {
        return (
            <div id="outer-container" className="App">
                <div className="container-fluid">
                    <div className="row">
                        <Media query="(max-width: 599px)">
                            {(matches) => {
                                if (matches) {
                                    this.props.toggleMenu(false);
                                }
                                return (
                                    <Sidebar
                                        onCardAdd={this.props.onCardAdd}
                                        dispatch={this.props.dispatch}
                                        noOverlay={!matches}
                                        currentCard={this.props.cardId}
                                        className="col-sm-3 col-md-2 sidebar"
                                    >
                                        <Link key={null} to="/">All</Link>
                                        {Object.keys(this.props.cards).map(id =>
                                            <Link key={id} to={`/${id}`}>
                                                {this.props.cards[id].name}
                                                <button
                                                    className="destroy"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        this.props.onCardRemove(id);
                                                    }}
                                                />
                                            </Link>
                                        )}
                                    </Sidebar>
                                );
                            }}
                        </Media>
                        <div
                            id="page-wrap"
                            className="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main"
                        >
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
