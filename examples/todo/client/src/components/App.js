import React from "react";
import { BrowserRouter as Router, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function(props) {
  const links = Object.keys(props.cards).map(key => (
    <Link key={key} to={`/${key}`}>{props.cards[key].name}</Link>
  ))
  return (
    <Router>
      <div className="App">
        <Navbar title="Todo Example">
        </Navbar>
        <Sidebar>
            {links}
        </Sidebar>
      </div>
    </Router>
  );
}
