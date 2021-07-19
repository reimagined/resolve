const safeName = (name: string) => name.replace(/@/, '').replace(/[/|\\]/g, '-')
export default safeName
