const { __non_webpack_require__ } = global

export const pureRequire =
  global.__non_webpack_require__ != null
    ? global.__non_webpack_require__
    : require
