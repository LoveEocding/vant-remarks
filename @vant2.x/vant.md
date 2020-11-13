# 项目结构

![](https://oscimg.oschina.net/oscnet/up-4134013c8634305c33158124907317b6f55.png)

## vant_config.js

vant-cli配置文件.使用build构建命令的时候，vant-cli会查询配置文件进行构建任务。详情参数请查看官方文档

## webpack.config.js

vant-cli已经内置了一套打包配置，这个是额外的我们想添加的一些配置，vant-cli 内部会使用webpack-merge 合并配置

## Src源代码目录

所有源代码放这里,必须按照约定的结构编写如这样：

![](https://oscimg.oschina.net/oscnet/up-d56270349cc76f8641327615b239bc1b2e6.png)

vant-cli会按照目录结构生成文档网站：

![](https://oscimg.oschina.net/oscnet/up-218e3db275fc872e7049094b0280ec34728.png)

### 举列子 Swiper组件 看源码

![](https://oscimg.oschina.net/oscnet/up-c3a09afab65541fab375c97c109bcd68268.png)

```
import { createNamespace } from '../utils';  //创建一个组件基础

**这里的utils 主要封装一些公共的实例方法 看createNamespace 方法可以看到**

import { createBEM, BEM } from './bem'; 
import { createComponent } from './component';
import { createI18N, Translate } from './i18n';

type CreateNamespaceReturn = [
  ReturnType<typeof createComponent>,
  BEM,
  Translate
];

// 返回一个组件初始实列、文件名后缀如, 中文版本
export function createNamespace(name: string): CreateNamespaceReturn {
  name = 'van-' + name;
  return [createComponent(name), createBEM(name), createI18N(name)];
}


```

![](https://oscimg.oschina.net/oscnet/up-c43f8e153930dcbac2bb47a721258498c28.png)

# 总结

vant 组件库源码封装的比较好，扩展性很强，各个组件的实现效果可以具体看组件源码。还是比较容易读懂，在实现自己组件库给了很好的方向。 重点核心还是看一下vant-cli 源码，因为整个组件库是在这个脚手架子上面的。接下来会一步一步看vant-cli 实现思路