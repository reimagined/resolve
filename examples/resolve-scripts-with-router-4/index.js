import React from 'react';
import { Switch, Route } from 'react-router';
import { Link } from 'react-router-dom';

const HomeComponent = () => <h1>Home</h1>;
const AboutComponent = () => <h1>About</h1>;

export default () =>
    <div>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Switch>
            <Route path="/about" component={AboutComponent} />
            <Route path="/" component={HomeComponent} />
        </Switch>
    </div>;
