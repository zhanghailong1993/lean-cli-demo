const { name, version } = require('../../package.json')
const downloadDirectory = `${process.env[process.platform === 'darwin'? 'HOME': 'USERPROFILE']}/.myTemplate`
module.exports = {
  name,
  version,
  downloadDirectory
}