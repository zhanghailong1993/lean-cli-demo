const ora = require('ora')
const path = require('path')
const axios = require('axios')
const inquirer = require('inquirer')
const fs = require('fs')
const { promisify } = require('util')
const MetalSmith = require('MetalSmith')
const ncp = require('ncp')
let downloadGit = require('download-git-repo')
let { render } = require('consolidate').ejs
render = promisify(render) // 包装渲染方法
const { downloadDirectory } = require('./constants')
downloadGit = promisify(downloadGit)

// 根据我们想要实现的功能配置执行动作，遍历产生对应的命令
const mapActions = {
  create: {
    alias: 'c', //别名
    description: '创建一个项目', // 描述
    examples: [ //用法
      'lee-cli create <project-name>'
    ]
  },
  config: {
    alias: 'conf', //别名
    description: 'config project variable', // 描述
    examples: [ //用法
      'lee-cli config set <k> <v>',
      'lee-cli config get <k>'
    ] 
  },
  '*': {
    alias: '', //别名
    description: 'command not found', // 描述
    examples: [] //用法
  }
}

// 封装loading效果
const fnLoadingByOra = (fn, message) => async (...argv) => {
  const spinner = ora(message)
  spinner.start()
  let result = await fn(...argv)
  spinner.succeed() // 结束loading
  return result
}
const getTagLists = async (repo) =>{
  const {data} = await axios.get(`https://api.github.com/repos/lxy-cli/${repo}/tags`)
  return data
}

const fetchReopLists = async () => {
  // 获取当前组织中的所有仓库信息,这个仓库中存放的都是项目模板
  const { data } = await axios.get('https://api.github.com/orgs/lxy-cli/repos')
  return data
}

const downDir = async(repo, tag) => {
  //下载的项目
  let project = `lxy-cli/${repo}`
  if (tag) {
    project += `#${tag}`
  }
  // c:/users/lee/.myTemplate
  let dest = `${downloadDirectory}/${repo}#${tag}`
   //把项目下载当对应的目录中
  try {
    await downloadGit(project, dest)
  } catch (error) {
    console.log('错误了吗？？？\n');
    console.log(error);
  }
  return dest
}
// 复制项目从临时文件到本地工作项目
const copyTempToLoclhost = async (target, projectName) => {
  const resolvePath = path.join(path.resolve(), projectName)
  // 此处模拟如果仓库中有ask.js就表示是复杂的仓库项目
  if (!fs.existsSync(path.join(target, 'ask.js'))) {
    await ncp(target, resolvePath)
    // console.log(target)
    // fs.rmdirSync(target)
  } else {
    //复杂项目
    // 1) 让用户填信息
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname)
        .source(target)  // 遍历下载的目录
        .destination(resolvePath) // 最终编译好的文件存放位置
        .use(async (files,metalsmith, done) => {
          let args = require(path.join(target, 'ask.js'))
          let res = await inquirer.prompt(args)
          let met = metalsmith.metadata()
           // 将询问的结果放到metadata中保证在下一个中间件中可以获取到
          Object.assign(met, res)
          ///  ask.js 只是用于 判断是否是复杂项目 且 内容可以定制复制到本地不需要
          delete files['ask.js']
          done()
        })
        .use((files, metal, done) => {
          const res = metal.metadata()
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('.js') || file.includes('.json')) {
              let content = files[file].contents.toString()  //文件内容
              if (content.includes('<%')) {
                content = await render(content, res)
                files[file].contents = Buffer.from(content)  //渲染
              }
            }
          })
          done()
        })
        .build((err) => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
    })

  }
}

module.exports = {
  mapActions,
  fnLoadingByOra,
  getTagLists,
  fetchReopLists,
  downDir,
  copyTempToLoclhost
}