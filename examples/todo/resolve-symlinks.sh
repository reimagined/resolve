#!/bin/bash

cd ./node_modules
for i in ./*; do
    if [[ -L $i ]]; then
        real=$(readlink "$i")
        rm -rf "$i"
        cp -rf "$real" "$i"
    fi 
done
cd ..

