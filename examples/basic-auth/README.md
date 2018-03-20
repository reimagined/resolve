# Basic Auth Example

## Login Page

![Login Page](https://user-images.githubusercontent.com/5055654/37658198-09978e02-2c5e-11e8-8e67-801bbffcc628.png)

## User access

![User access](https://user-images.githubusercontent.com/5055654/37658195-0959cee6-2c5e-11e8-8960-3d7a2fe318e0.png)

## Anonymous access

![Anonymous access](https://user-images.githubusercontent.com/5055654/37658197-09769ad0-2c5e-11e8-8ba1-1782d2ae44d8.png)

## Passport Local Credentials

| Username | Password |
| -------- | -------- |
| Alice    | 123    |
| Bob      | 456    |
| Eva      | 789    |

## Passport Github/Google Credentials

Create a .env file in the root directory of your project. Add environment-specific variables on new lines in the form of NAME=VALUE.

```sh
GITHUB_CLIENT_ID = ENTER_YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET = ENTER_YOUR_GITHUB_CLIENT_SECRET
```
For more information, see https://github.com/jaredhanson/passport-github

```sh
GOOGLE_CLIENT_ID = ENTER_YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = ENTER_YOUR_GOOGLE_CLIENT_SECRET
```

For more information, see https://github.com/jaredhanson/passport-google-oauth2

