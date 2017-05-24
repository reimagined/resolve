import React, { Component } from 'react';
import classnames from 'classnames';

export default class TodoTextInput extends Component {
    constructor(props) {
        super(props);
        this.state = { text: this.props.text || '' };
        this._handleSubmit = (e) => {
            const text = e.target.value.trim();
            if (e.which === 13) {
                this.props.onSave(text);
                if (this.props.newTodo) {
                    this.setState({ text: '' });
                }
            }
        };
        this._handleChange = e => this.setState({ text: e.target.value });
        this._handleBlur = (e) => {
            if (!this.props.newTodo) {
                this.props.onSave(e.target.value);
            }
        };
    }

    render() {
        return (
            <input
                className={classnames({
                    edit: this.props.editing,
                    'new-todo': this.props.newTodo
                })}
                type="text"
                placeholder={this.props.placeholder}
                autoFocus="true"
                value={this.state.text}
                onBlur={this._handleBlur}
                onChange={this._handleChange}
                onKeyDown={this._handleSubmit}
            />
        );
    }
}
