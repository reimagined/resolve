const safeName = name => `${name.replace(/@/, '').replace(/[/|\\]/g, '-')}.tgz`

module.exports = { safeName }
