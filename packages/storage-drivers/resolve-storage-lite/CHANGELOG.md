# Change Log

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.



<a name="0.0.28"></a>
## 0.0.28 (2017-09-22)


### Performance Improvements

* **resolve-storage-lite:** use nedb instead of simple file storage ([3ca48ba](https://github.com/reimagined/resolve/commit/3ca48ba))


### BREAKING CHANGES

* **resolve-storage-lite:** resolve-storage-memory and resolve-storage-file are replaced by resolve-storage-lite. This package supports two behaviors. Don't pass any arguments if you want to use it as in-memory storage and pass the path to the db file to use it as file storage.

