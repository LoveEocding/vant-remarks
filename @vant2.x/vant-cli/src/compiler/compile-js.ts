import { transformAsync } from '@babel/core'; //babel 核心
import { readFileSync, removeSync, outputFileSync } from 'fs-extra';
import { replaceExt } from '../common';
import { replaceCssImport } from '../common/css';

//使用bable 编译js 代码
export function compileJs(filePath: string): Promise<undefined> {
  return new Promise((resolve, reject) => {
    let code = readFileSync(filePath, 'utf-8');

    code = replaceCssImport(code);

    transformAsync(code, { filename: filePath })
      .then(result => {
        if (result) {
          const jsFilePath = replaceExt(filePath, '.js');

          removeSync(filePath);
          outputFileSync(jsFilePath, result.code);
          resolve();
        }
      })
      .catch(reject);
  });
}
