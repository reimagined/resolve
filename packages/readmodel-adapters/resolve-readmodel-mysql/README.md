# **resolve-readmodel-mysql**
[![npm version](https://badge.fury.io/js/resolve-readmodel-mysql.svg)](https://badge.fury.io/js/resolve-readmodel-mysql)

Read model adapter for MySQL database and compatible instances, like AWS Aurora, and requires MySQL 5.7 engine.
Adapter provides Simple query API for projection and resolvers, compatible with resolve stock provided adapters.

Take in mind following aspects when using this adapter:
- Indexes fields can store only strings in `utf8mb4` character set with collation `utf8mb4_unicode_ci` https://dev.mysql.com/doc/refman/5.5/en/charset-unicode-utf8mb4.html
- All other fields are stored within `json` column as `longblob` internal datatype https://dev.mysql.com/doc/refman/5.7/en/json.html
- Maximum packet size in MySQL server engine options https://dev.mysql.com/doc/refman/5.7/en/server-system-variables.html#sysvar_max_allowed_packet
- Use proper connection names / request / result dataset encodings / character sets / collations, compatible with your data

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-readmodel-mysql-readme?pixel)
