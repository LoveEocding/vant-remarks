import { relative, sep, join } from 'path';
import { CSS_LANG } from '../common/css';
import { existsSync } from 'fs-extra';
import { getDeps, clearDepsCache, fillExt } from './get-deps';
import { getComponents, smartOutputFile } from '../common';
import { SRC_DIR, STYPE_DEPS_JSON_FILE } from '../common/constant'; 

function matchPath(path: string, component: string): boolean {
  const p = relative(SRC_DIR, path);
  const arr = p.split(sep);
  return arr.includes(component);
}

function getStylePath(component: string) {
  return join(SRC_DIR, `${component}/index.${CSS_LANG}`);
}

export function checkStyleExists(component: string) {
  return existsSync(getStylePath(component));
}

// analyze component dependencies 分析组件依赖
// compents [url]
// component url
function analyzeComponentDeps(components: string[], component: string) {
  const checkList: string[] = [];
  const componentEntry = fillExt(join(SRC_DIR, component, 'index')); //填充文件后缀 返回地址L 绝对地址/src/组件名/index.js or后缀
  const record = new Set(); //set 存储路径

  function search(filePath: string) {
    record.add(filePath);
    //get deps 返回引用路径  数组[组件地址]
    getDeps(filePath).forEach(key => {
      if (record.has(key)) {
        return;
      }

      search(key);
      components
        .filter(item => matchPath(key, item))
        .forEach(item => {
          if (!checkList.includes(item) && item !== component) {
            checkList.push(item);
          }
        });
    });
  }

  search(componentEntry);

  return checkList.filter(checkStyleExists);
}

type DepsMap = Record<string, string[]>;


//得到有依赖父组件的文件名 数组
function getSequence(components: string[], depsMap: DepsMap) {
  const sequence: string[] = [];
  const record = new Set();

  function add(item: string) {
    const deps = depsMap[item];

    if (sequence.includes(item) || !deps) {
      return;
    }

    if (record.has(item)) {
      sequence.push(item);
      return;
    }

    record.add(item);

    if (!deps.length) {
      sequence.push(item);
      return;
    }

    deps.forEach(add);

    if (sequence.includes(item)) {
      return;
    }

    const maxIndex = Math.max(...deps.map(dep => sequence.indexOf(dep)));

    sequence.splice(maxIndex + 1, 0, item);
  }

  components.forEach(add);

  return sequence;
}

export async function genStyleDepsMap() {
  const components = getComponents(); //得到组件路径数组

  return new Promise(resolve => {
    clearDepsCache(); //清楚缓存

    const map = {} as DepsMap;
     
    //得到组件为索引的，组件依赖路径 
    components.forEach(component => {
      map[component] = analyzeComponentDeps(components, component); //依赖对象 数组[依赖路径]
    });
    
    
    //map   { '组件文件名':[{'组件名'依赖路径名'}]  }
   
    //得到有依赖的组件吗  components [组件名]
    const sequence = getSequence(components, map);
    
    //排序
    Object.keys(map).forEach(key => {
      map[key] = map[key].sort(
        (a, b) => sequence.indexOf(a) - sequence.indexOf(b)
      );
    });
   
    // 向style-deps.json 文件写入依赖
    smartOutputFile(
      STYPE_DEPS_JSON_FILE,
      JSON.stringify({ map, sequence }, null, 2)
    );

    resolve();
  });
}
