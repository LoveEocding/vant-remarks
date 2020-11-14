#!/usr/bin/env node
import { command, parse, version } from 'commander'; // 第三方命令行插件

// @ts-ignore
import packageJson from '../package.json';

// commands
import { dev } from './commands/dev';
import { lint } from './commands/lint';
import { test } from './commands/jest';
import { clean } from './commands/clean';
import { build } from './commands/build';  //构建命令
import { release } from './commands/release';
import { changelog } from './commands/changelog';
import { buildSite } from './commands/build-site';
import { commitLint } from './commands/commit-lint';

version(`@vant/cli ${packageJson.version}`);  //提示版本号

process.env.VANT_CLI_VERSION = packageJson.version;  //环境变量版本号

command('dev')
  .description('Run webpack dev server')
  .action(dev);

command('lint')
  .description('Run eslint and stylelint')
  .action(lint);

command('test')
  .description('Run unit tests through jest')
  .option(
    '--watch',
    'Watch files for changes and rerun tests related to changed files'
  )
  .option(
    '--clearCache',
    'Clears the configured Jest cache directory and then exits'
  )
  .action(test);

command('clean')
  .description('Clean all dist files')
  .action(clean);

command('build')                                //注册build构建命令
  .description('Compile components in production mode')
  .option('--watch', 'Watch file change') //添加--watch 会随时监听文件变化
  .action(build);

command('release')
  .description('Compile components and release it')
  .action(release);

command('build-site')
  .description('Compile site in production mode')
  .action(buildSite);

command('changelog')
  .description('Generate changelog')
  .action(changelog);

command('commit-lint')
  .description('Lint commit message')
  .action(commitLint);

parse();
