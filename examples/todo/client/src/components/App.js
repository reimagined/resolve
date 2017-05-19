import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Media from 'react-media';
import { action as toggleMenu } from 'redux-burger-menu';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import Sidebar from './Sidebar';

export default class App extends Component {
    componentDidMount() {
        this.props.dispatch(toggleMenu(true));
    }

    render() {
        const links = Object.keys(this.props.cards).map(key => (
            <Link key={key} to={`/${key}`}>
                {this.props.cards[key].name}
                <button className="destroy" onClick={() => {}} />
            </Link>
        ));

        return (
            <div id="outer-container" className="App">
                <div className="container-fluid">
                    <div className="row">
                        <Media query="(max-width: 599px)">
                            {(matches) => {
                                if (matches) {
                                    this.props.dispatch(toggleMenu(false));
                                }
                                return (
                                    <Sidebar
                                        dispatch={this.props.dispatch}
                                        noOverlay={!matches}
                                        currentCard={this.props.cardId}
                                        className="col-sm-3 col-md-2 sidebar"
                                    >
                                        {links}
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
