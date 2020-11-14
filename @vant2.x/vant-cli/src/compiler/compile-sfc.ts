import * as compiler from 'vue-template-compiler';  //模本编译
import * as compileUtils from '@vue/component-compiler-utils'; //用于编制低级实用组件 能够在vue-loader15以上使用 
import hash from 'hash-sum';
import { parse } from 'path';
import { remove, writeFileSync, readFileSync } from 'fs-extra';
import { replaceExt } from '../common';
import { compileJs } from './compile-js';
import { compileStyle } from './compile-style';

const RENDER_FN = '__vue_render__';
const STATIC_RENDER_FN = '__vue_staticRenderFns__';
const EXPORT = 'export default {';

// trim some unused code
function trim(code: string) {
  return code.replace(/\/\/\n/g, '').trim();
}

function getSfcStylePath(filePath: string, ext: string, index: number) {
  const number = index !== 0 ? `-${index + 1}` : '';
  return replaceExt(filePath, `-sfc${number}.${ext}`);
}

// inject render fn to script 把render 函数注入到Jscript  最终类似是这种
/* render(){

}*/
function injectRender(script: string, render: string) {
  script = trim(script);

  render = render
    .replace('var render', `var ${RENDER_FN}`)
    .replace('var staticRenderFns', `var ${STATIC_RENDER_FN}`);

  return script.replace(
    EXPORT,
    `${render}\n${EXPORT}\n  render: ${RENDER_FN},\n\n  staticRenderFns: ${STATIC_RENDER_FN},\n`
  );
}

function injectScopeId(script: string, scopeId: string) {
  return script.replace(EXPORT, `${EXPORT}\n  _scopeId: '${scopeId}',\n\n`);
}
//向js 注入style
function injectStyle(
  script: string,
  styles: compileUtils.SFCBlock[], 
  filePath: string
) {
  if (styles.length) {     // 拼接字符串 得到import 'index.css'
    const imports = styles 
      .map((style, index) => {
        const { base } = parse(getSfcStylePath(filePath, 'css', index));//
        return `import './${base}';`;
      })
      .join('\n');

    return script.replace(EXPORT, `${imports}\n\n${EXPORT}`); 
  }

  return script;
}

//编译html  返回render 函数 详情请查看
//https://github.com/vuejs/component-compiler-utils/blob/8b0da745c5a4c7a07b3b88560a1d1cb3c00a9d32/lib/compileTemplate.ts#L40 源码
function compileTemplate(template: string) {
  const result = compileUtils.compileTemplate({
    compiler,
    source: template,
    isProduction: true,
  } as any);

  return result.code; // render 函数字符串
}

// 解析 vue文件
export function parseSfc(filePath: string) {
  const source = readFileSync(filePath, 'utf-8');

  const descriptor = compileUtils.parse({
    source,
    compiler,
    needMap: false,
  } as any);
  return descriptor;  //descriptor 结构包含 html 部分 js部分
}

// 编译vue 后缀的文件
export async function compileSfc(filePath: string): Promise<any> {
  const tasks = [remove(filePath)];
  const source = readFileSync(filePath, 'utf-8');
  const jsFilePath = replaceExt(filePath, '.js'); //后缀替换成js后缀   /\.\w+$/
  const descriptor = parseSfc(filePath);  //使用vue 解析组件 会拆分js style content
  const { template, styles } = descriptor;

  const hasScoped = styles.some(s => s.scoped); //是否拥有局域css
  const scopeId = hasScoped ? `data-v-${hash(source)}` : ''; //有局域css 使用hash值

  // compile js part  编译js 部分
  if (descriptor.script) {
    tasks.push(
      new Promise((resolve, reject) => {
        let script = descriptor.script!.content; //提取js部分
        script = injectStyle(script, styles, filePath); //注入css 

        if (template) {   //如果有html 
          const render = compileTemplate(template.content); //得到render 函数
          script = injectRender(script, render); //把render 函数注入js中
        }

        if (scopeId) {   //如果有作用域限制 添加hash 值
          script = injectScopeId(script, scopeId);
        }

        writeFileSync(jsFilePath, script);  //写入Js函数 编译Js
        compileJs(jsFilePath)
          .then(resolve)
          .catch(reject);
      })
    );
  }

  // compile style part  前面注入了css 如imporant 'index.css' 这里是实际编译css
  tasks.push(
    ...styles.map((style, index: number) => {
      const cssFilePath = getSfcStylePath(filePath, style.lang || 'css', index);

      let styleSource = trim(style.content);

      if (style.scoped) {
        styleSource = compileUtils.compileStyle({
          id: scopeId,
          scoped: true,
          source: styleSource,
          filename: cssFilePath,
          preprocessLang: style.lang,
        }).code;
      }

      writeFileSync(cssFilePath, styleSource);

      return compileStyle(cssFilePath);
    })
  );

  return Promise.all(tasks);
}
