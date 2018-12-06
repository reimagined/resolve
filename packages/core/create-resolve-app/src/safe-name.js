export default safeName => safeName.replace(/@/, '').replace(/[/|\\]/g, '-')
