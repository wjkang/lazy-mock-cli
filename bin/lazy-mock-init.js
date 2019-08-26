#!/usr/bin/env node
const download = require('download-git-repo')
const program = require('commander')
const ora = require('ora')
const exists = require('fs').existsSync
const rm = require('rimraf').sync
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const home = require('user-home')
const fse = require('fs-extra')
const tildify = require('tildify')
const cliSpinners = require('cli-spinners')
const logger = require('../lib/logger')
const localPath = require('../lib/local-path')

const isLocalPath = localPath.isLocalPath
const getTemplatePath = localPath.getTemplatePath

program
	.usage('<template-name> [project-name]')
	.option('-c, --clone', 'use git clone')
	.option('--offline', 'use cached template')

program.on('--help', () => {
	console.log('  Examples:')
	console.log()
	console.log(chalk.gray('    # create a new project with an official template'))
	console.log('    $ lazy-mock init d2-admin-pm my-project')
	console.log()
	console.log(chalk.gray('    # create a new project straight from a github template'))
	console.log('    $ vue init username/repo my-project')
	console.log()
})

function help() {
	program.parse(process.argv)
	if (program.args.length < 1) return program.help()
}
help()
//模板
let template = program.args[0]
//判断是否使用官方模板
const hasSlash = template.indexOf('/') > -1
//项目名称
const rawName = program.args[1]
//在当前文件下创建
const inPlace = !rawName || rawName === '.'
//项目名称
const name = inPlace ? path.relative('../', process.cwd()) : rawName
//创建项目完整目标位置
const to = path.resolve(rawName || '.')
const clone = program.clone || false

//缓存位置
const serverTmp = path.join(home, '.lazy-mock', 'sever')
const simpleServerTmp = path.join(home, '.lazy-mock', 'simple-sever')
const isSimpleServer = template === 'simple'
const tmp = path.join(home, '.lazy-mock', 'templates', template.replace(/[\/:]/g, '-'))
if (program.offline) {
	console.log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`)
	template = tmp
}

//判断是否当前目录下初始化或者覆盖已有目录
if (inPlace || exists(to)) {
	inquirer
		.prompt([
			{
				type: 'confirm',
				message: inPlace ? 'Generate project in current directory?' : 'Target directory exists. Continue?',
				name: 'ok'
			}
		])
		.then(answers => {
			if (answers.ok) {
				run()
			}
		})
		.catch(logger.fatal)
} else {
	run()
}

function run() {
	//使用本地缓存
	if (isLocalPath(template)) {
		const templatePath = getTemplatePath(template)
		if (exists(templatePath)) {
			generate(name, templatePath, to, err => {
				if (err) logger.fatal(err)
				console.log()
				logger.success('Generated "%s"', name)
			})
		} else {
			logger.fatal('Local template "%s" not found.', template)
		}
	} else {
		if (!hasSlash) {
			//使用官方模板
			const officialTemplate = 'lazy-mock-templates/' + template
			downloadAndGenerate(officialTemplate)
		} else {
			downloadAndGenerate(template)
		}
	}
}

function downloadAndGenerate(template) {
	downloadServer(() => {
		downloadTemplate(template)
	})
}

function downloadServer(done) {
	const spinner = ora('downloading server')
	spinner.spinner = cliSpinners.bouncingBall
	spinner.start()
	if (!isSimpleServer) {
		if (exists(serverTmp)) rm(serverTmp)
		download('wjkang/lazy-mock', serverTmp, { clone }, err => {
			spinner.stop()
			if (err) logger.fatal('Failed to download server ' + template + ': ' + err.message.trim())
			done()
		})
	} else {
		if (exists(simpleServerTmp)) rm(simpleServerTmp)
		download('wjkang/lazy-mock#simple', simpleServerTmp, { clone }, err => {
			spinner.stop()
			if (err) logger.fatal('Failed to download server ' + template + ': ' + err.message.trim())
			done()
		})
	}
}

function downloadTemplate(template) {
	const spinner = ora('downloading template')
	spinner.spinner = cliSpinners.bouncingBall
	spinner.start()
	if (exists(tmp)) rm(tmp)
	download(template, tmp, { clone }, err => {
		spinner.stop()
		if (err) logger.fatal('Failed to download template ' + template + ': ' + err.message.trim())
		generate(name, tmp, to, err => {
			if (err) logger.fatal(err)
			console.log()
			logger.success('Generated "%s"', name)
		})
	})
}

function generate(name, src, dest, done) {
	try {
		fse.removeSync(path.join(isSimpleServer ? simpleServerTmp : serverTmp, 'templates'))
		const packageObj = fse.readJsonSync(path.join(isSimpleServer ? simpleServerTmp : serverTmp, 'package.json'))
		packageObj.name = name
		packageObj.author = ''
		packageObj.description = ''
		packageObj.ServerFullPath = path.join(dest)
		packageObj.FrontendFullPath = ''
		fse.writeJsonSync(path.join(isSimpleServer ? simpleServerTmp : serverTmp, 'package.json'), packageObj, { spaces: 2 })
		fse.copySync(isSimpleServer ? simpleServerTmp : serverTmp, dest)
		fse.copySync(path.join(src, 'templates'), path.join(dest, 'templates'))
	} catch (err) {
		done(err)
		return
	}
	done()
}
