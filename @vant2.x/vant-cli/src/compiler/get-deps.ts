import { join } from 'path';
import { SCRIPT_EXTS } from '../common/constant';
import { readFileSync, existsSync } from 'fs-extra';

let depsMap: Record<string, string[]> = {};
let existsCache: Record<string, boolean> = {};

// https://regexr.com/47jlq
const IMPORT_RE = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g;

//匹配impoart 引入  返回数组
function matchImports(code: string): string[] {
  return code.match(IMPORT_RE) || [];
}

function exists(filePath: string) {
  if (!(filePath in existsCache)) {
    existsCache[filePath] = existsSync(filePath);
  }

  return existsCache[filePath];
}

//填充文件后缀列如 index.js index.jsx index.vue
//filePath 绝对地址/文件夹名/index
export function fillExt(filePath: string) {  
  for (let i = 0; i < SCRIPT_EXTS.length; i++) {
    const completePath = `${filePath}${SCRIPT_EXTS[i]}`;  //index.js or index.jsx等
    if (exists(completePath)) {
      return completePath;
    }
  }

  for (let i = 0; i < SCRIPT_EXTS.length; i++) {
    const completePath = `${filePath}/index${SCRIPT_EXTS[i]}`;
    if (exists(completePath)) {
      return completePath;
    }
  }

  return '';
}

// code :'impoart xxx from 'xxx' file:'文件路径'
// 返回 引用路径 如 C：//xxxxx/index.less
function getPathByImport(code: string, filePath: string) {
  const divider = code.includes('"') ? '"' : "'"; // 是用什么 "" or ''
  const relativePath = code.split(divider)[1]; //分割得到引用路径 

  if (relativePath.includes('.')) {  //是否是本地引用有.
    return fillExt(join(filePath, '..', relativePath));
  }
  //没有. 就是node_modules引用
  return null;
}

export function clearDepsCache() {
  depsMap = {};
  existsCache = {};
}

// 文件路径  xxx/src/组件名/index.js
export function getDeps(filePath: string) {
  if (depsMap[filePath]) { //设置缓存 如果有就直接返回
    return depsMap[filePath];
  }
  
  const code = readFileSync(filePath, 'utf-8');  //文件内容 
  const imports = matchImports(code); // 使用正则表达式 配置impoant 引入 返回引入数组['import XX from 'xxxx'']
  const paths = imports
    .map(item => getPathByImport(item, filePath)) //返回引用路径： /绝对地址/引用对象文件
    .filter(item => !!item) as string[]; 

  depsMap[filePath] = paths; //存储地址 一维 key: 父级组件路径  value:子组件路径

  paths.forEach(getDeps); // 依次深度遍历,依赖文件

  return paths;  //返回 引入的组件路径：  数组[引用组件的路径]
}
