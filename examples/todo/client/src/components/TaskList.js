import React from 'react';

export default function(props) {
    console.log(props.tasks);
    return (
        <div>
            <h1 className="page-header">{props.title}</h1>
            <ul>
                {Object.keys(props.tasks).map(key => (
                    <li key={key}>{props.tasks[key].name}</li>
                ))}
            </ul>
        </div>
    );
}
