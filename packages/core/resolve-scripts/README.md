# **resolve-scripts**
[![npm version](https://badge.fury.io/js/resolve-scripts.svg)](https://badge.fury.io/js/resolve-scripts)

This package includes scripts and configuration for the [create-resolve-app](../create-resolve-app) package.


### Configuration File

You can configure reSolve in the `config.app.json`, `config.dev.json`, `config.prod.json`, `config.test_functional.json` files, or in the file passed as an argument with the `--config` key, for example:

```sh
npm run dev -- --config=custom-resolve.config.json
npm run build -- --config=custom-resolve.config.json
```

or with `yarn`:

```sh
yarn run dev --config=custom-resolve.config.json
yarn run build --config=custom-resolve.config.json
```

Please keep in mind that the resulting configuration must match the [JSON Schema ReSolve Config](./configs/schema.resolve.config.json)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-scripts-readme?pixel)
