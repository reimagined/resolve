const now = require('performance-now')

const start = (marks, name) => {
  if (marks.get(name) != null) {
    throw Error(`${name}: performance mark already started`)
  }
  marks.set(name, {
    start: now(),
    end: NaN,
    duration: NaN,
  })
}

const finish = (marks, name) => {
  const mark = marks.get(name)
  if (mark == null) {
    throw Error(`${name}: performance mark not found`)
  }
  const end = now()
  marks.set(name, {
    ...mark,
    end,
    duration: Math.round((end - mark.start).toFixed(3) / 1000),
  })
}

const time = (marks, name) => {
  const mark = marks.get(name)
  if (mark == null) {
    throw Error(`${name}: performance mark not found`)
  }
  return mark.duration
}

const createProfiler = () => {
  const marks = new Map()
  return {
    start: start.bind(null, marks),
    finish: finish.bind(null, marks),
    time: time.bind(null, marks),
  }
}

module.exports = {
  createProfiler,
}
