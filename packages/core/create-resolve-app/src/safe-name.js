const safeName = (name) => name.replace(/@/, '').replace(/[/|\\]/g, '-')
export default safeName
