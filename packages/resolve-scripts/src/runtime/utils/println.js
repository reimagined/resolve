// eslint-disable-next-line no-console
const println = (...args) => console.log(...args)
// eslint-disable-next-line no-console
println.error = (...args) => console.error(...args)

export default println
