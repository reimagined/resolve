#!/bin/bash -v
yarn
cd packages/resolve-scripts
yarn pack --filename=resolve-scripts.tgz
cd ../..

cd examples/expo-todo
npm install --silent
npm remove resolve-scripts
npm install ../../packages/resolve-scripts/resolve-scripts.tgz