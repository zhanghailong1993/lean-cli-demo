const { program } = require('commander')
const path = require('path')
const { version } = require('./utils/constants')
const { mapActions } = require('./utils/common')

Reflect.ownKeys(mapActions).forEach((action) => {
  program.command(action) //配置命令的名字
    .alias(mapActions[action].alias) // 命令的别名
    .description(mapActions[action].description)  // 命令对应的描述
    .action(() => { //动作
      if (action === '*') {
        console.log(mapActions[action].description)
      } else {
        require(path.join(__dirname, action))(...process.argv.slice(3))
      }
    })
})
// 监听用户的help事件
program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(`${example}`)
    })
  })
})
program.version(version).parse()