//打包构建文件
import chokidar from 'chokidar';  //文件监听插件  
import { join, relative } from 'path';
import { remove, copy, readdirSync } from 'fs-extra'; //文件插件组件库
import { clean } from './clean'; // 文件删除操作
import { CSS_LANG } from '../common/css'; //样式文件操作
import { ora, consola, slimPath } from '../common/logger'; //日志
import { installDependencies } from '../common/manager'; //依赖
import { compileJs } from '../compiler/compile-js';  //js 编译
import { compileSfc } from '../compiler/compile-sfc';  // vue 编译 包括js css temlpate
import { compileStyle } from '../compiler/compile-style'; //style 编译
import { compilePackage } from '../compiler/compile-package';  //编译 package node_modules 内容
import { genPackageEntry } from '../compiler/gen-package-entry'; // 生成包 导入的上下文 列如impoart ** VUe.use
import { genStyleDepsMap } from '../compiler/gen-style-deps-map';
import { genComponentStyle } from '../compiler/gen-component-style';
import { SRC_DIR, LIB_DIR, ES_DIR } from '../common/constant';
import { genPacakgeStyle } from '../compiler/gen-package-style';
import { genVeturConfig } from '../compiler/gen-vetur-config';
import {
  isDir, 
  isSfc, //是否是vue 后缀的文件
  isStyle,
  isScript,
  isDemoDir,
  isTestDir,
  setNodeEnv,//设置node 环境变量
  setModuleEnv,//设置bable 变量
} from '../common';

//编译文件
async function compileFile(filePath: string) {
  if (isSfc(filePath)) {  //是否是vue后缀
    return compileSfc(filePath);
  }

  if (isScript(filePath)) { //是否是js后缀
    return compileJs(filePath);
  }

  if (isStyle(filePath)) { //style
    return compileStyle(filePath);
  }

  return remove(filePath);//移除已经编译好了的文件
}
//编译目录 接着深度遍历
async function compileDir(dir: string) {
  const files = readdirSync(dir);

  await Promise.all(
    files.map(filename => {
      const filePath = join(dir, filename);

      if (isDemoDir(filePath) || isTestDir(filePath)) {
        return remove(filePath);
      }

      if (isDir(filePath)) {
        return compileDir(filePath);
      }

      return compileFile(filePath);
    })
  );
}

async function buildEs() {   //打包es模块
  setModuleEnv('esmodule'); //设置bable 变量为esmodule
  await copy(SRC_DIR, ES_DIR); //复制src 文件到es 模块
  await compileDir(ES_DIR);
}

async function buildLib() { //打包lib文件夹
  setModuleEnv('commonjs');  //使用commonjs 模式引入的打包方式 export require
  await copy(SRC_DIR, LIB_DIR);
  await compileDir(LIB_DIR);
}

async function buildStyleEntry() {
  await genStyleDepsMap();
  genComponentStyle();
}

async function buildPacakgeEntry() {
  const esEntryFile = join(ES_DIR, 'index.js');
  const libEntryFile = join(LIB_DIR, 'index.js');
  const styleEntryFile = join(LIB_DIR, `index.${CSS_LANG}`);

  genPackageEntry({
    outputPath: esEntryFile,
    pathResolver: (path: string) => `./${relative(SRC_DIR, path)}`,
  });

  setModuleEnv('esmodule');
  await compileJs(esEntryFile);

  genPacakgeStyle({
    outputPath: styleEntryFile,
    pathResolver: (path: string) => path.replace(SRC_DIR, '.'),
  });

  setModuleEnv('commonjs');
  await copy(esEntryFile, libEntryFile);
  await compileJs(libEntryFile);
  await compileStyle(styleEntryFile);
}

async function buildPackages() {
  setModuleEnv('esmodule');
  await compilePackage(false);
  await compilePackage(true);
  genVeturConfig();
}

const tasks = [
  {
    text: 'Build ESModule Outputs',
    task: buildEs,
  },
  {
    text: 'Build Commonjs Outputs',
    task: buildLib,
  },
  {
    text: 'Build Style Entry',
    task: buildStyleEntry,
  },
  {
    text: 'Build Package Entry',
    task: buildPacakgeEntry,
  },
  {
    text: 'Build Packed Outputs',
    task: buildPackages,
  },
];

async function runBuildTasks() {
  for (let i = 0; i < tasks.length; i++) {
    const { task, text } = tasks[i];
    const spinner = ora(text).start();

    try {
      /* eslint-disable no-await-in-loop */
      await task();
      spinner.succeed(text);
    } catch (err) {
      spinner.fail(text);
      console.log(err);
      throw err;
    }
  }

  consola.success('Compile successfully');
}

function watchFileChange() {
  consola.info('\nWatching file changes...');

  chokidar.watch(SRC_DIR).on('change', async path => {
    if (isDemoDir(path) || isTestDir(path)) {
      return;
    }

    const spinner = ora('File changed, start compilation...').start();
    const esPath = path.replace(SRC_DIR, ES_DIR);
    const libPath = path.replace(SRC_DIR, LIB_DIR);

    try {
      await copy(path, esPath);
      await copy(path, libPath);
      await compileFile(esPath);
      await compileFile(libPath);
      await genStyleDepsMap();
      genComponentStyle({ cache: false });
      spinner.succeed('Compiled: ' + slimPath(path));
    } catch (err) {
      spinner.fail('Compile failed: ' + path);
      console.log(err);
    }
  });
}

export async function build(cmd: { watch?: boolean } = {}) {
  setNodeEnv('production');

  try {
    await clean();
    await installDependencies();
    await runBuildTasks();

    if (cmd.watch) {
      watchFileChange();
    }
  } catch (err) {
    consola.error('Build failed');
    process.exit(1);
  }
}
