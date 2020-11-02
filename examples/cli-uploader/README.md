# Cli uploader Example

This example demonstrates how to design a CLI file uploader and handle file uploads on the server

```sh
npx create-resolve-app resolve-cli-uploader -e cli-uploader
```

To download files through the CLI, registration in the application is required.

## Web

![auth-form](https://user-images.githubusercontent.com/36447502/71248498-09501d80-232c-11ea-96b7-7ff9a298070f.png)

![cli-uploader](https://user-images.githubusercontent.com/36447502/71248375-c1c99180-232b-11ea-8e95-78485026bec8.png)

## CLI

```sh
$ cd cli-app

cli-app$ export APPLICATION_ORIGIN=http://localhost:3000
cli-app$ export PROJECT_ID=projectId
cli-app$ export LOGIN=login
cli-app$ export PASSWORD=password

cli-app$ node index.js

File: 419fb958-28d3-4132-bff5-bf7b0b28620a - not loaded
File: 419fb958-28d3-4132-bff5-bf7b0b28620a - loading start
File: 419fb958-28d3-4132-bff5-bf7b0b28620a - loading success
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-cli-uploader-readme?pixel)
