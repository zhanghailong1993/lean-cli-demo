const inquirer = require('inquirer')
const program = require('commander')

const { fnLoadingByOra, fetchReopLists, getTagLists, downDir, copyTempToLoclhost } = require('./utils/common')

module.exports = async (projectName) => {
  if (!projectName) {
    program.help()
    return
  }

  let repos = await fnLoadingByOra(fetchReopLists, '正在链接你的仓库...')()
  repos = repos.map(item => item.name)
  const { repo }= await inquirer.prompt([
    {
      type: 'list',
      name: 'repo',
      message: '请选择一个你要创建的项目',
      choices: repos
    }
  ])
  let tags = await fnLoadingByOra(getTagLists, `正在链接你的选择的仓库${repo}的版本号...`)(repo)
  tags = tags.map((item) => item.name)
  const { tag } = await inquirer.prompt([
    {
      type: 'list',
      name: 'tag',
      message: '请选择一个该项目的版本下载',
      choices: tags
    }
  ])
  // 下载项目到临时文件夹 C:\Users\lee\.myTemplate
  const target = await fnLoadingByOra(downDir, '下载项目中...')(repo, tag)
  await copyTempToLoclhost(target, projectName)
  console.log(`我现在选择了那个仓库？ ${repo}`);
  console.log(`仓库 ${repo}的版本信息列表：${tag}`);
  // console.log(`此处是文件${projectName}`);
}