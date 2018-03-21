# API References

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

## Environment Variables

### URL Settings
You can adjust your application's URL ([http://localhost:3000](http://localhost:3000/) is used by default) using the following environment variables:

* `HOST` - set the IP address;
* `PORT` - set the port;
* `HTTPS` - set to `true` to use `https` instead of `http`;
* `ROOT_DIR` - set the application's root directory. For example, `export ROOT_DIR=/newurl`. After that, the application is available at [http://localhost:3000/newurl](http://localhost:3000/newurl).

Environment variables are available on the client side using  `process.env.VARIABLE_NAME`.

### Custom Environment Variables
You can pass custom env variables to the client side. To do this, use the `RESOLVE_` prefix when naming a variable. After that, this variable is available on the client and server side via the `process.env` object.

