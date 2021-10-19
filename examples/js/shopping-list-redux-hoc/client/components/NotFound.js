import React from 'react'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
class NotFound extends React.PureComponent {
  render() {
    return (
      <div className="example-wrapper">
        <h1>Oops!</h1>
        <h2>404 Not Found</h2>
        Sorry, an error has occurred, Requested page not found!
        <br />
        <br />
        <Link to="/">
          <Button variant="primary">Take Me Home</Button>
        </Link>
      </div>
    )
  }
}
export default NotFound
