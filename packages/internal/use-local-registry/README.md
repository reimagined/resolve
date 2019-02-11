## Usage

#### First terminal
```sh
cd examples/example-name
yarn workspace @internal/root-yarn start
yarn workspace @internal/build-packages start
yarn workspace @internal/local-registry start
```

#### Second terminal (*nix OS)
```sh
cd examples/example-name
yarn workspace @internal/use-local-registry start "cd $(pwd) && yarn resolve-cloud deploy"
```

#### Second terminal (windows)
```sh
cd examples/example-name
yarn workspace @internal/use-local-registry start "cd %CD% && yarn resolve-cloud deploy"
```