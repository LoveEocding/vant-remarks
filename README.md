# Vant/Vant-cli 流程和源码赏析 （个人理解）注释、流图图持续更新

# 目录
[vant 源码分析](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/vant.md)  
[vant-cli 源码分析](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/vant-cli.md)  
## vant-cli 构建命令分析
[build构建命令](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/build.md)

[dev本地环境运行](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/dev.md)

[lint代码检查命令](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/lint.md)

[jest测试命令](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/jest.md)

[clean清除命令](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/clean.md)

[build-site构建文档站点命令](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/build_site.md)

[release](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/release.md)

[changelog](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/changelog.md)

[commit-lint提交并检查](https://github.com/LoveEocding/vant-remarks/blob/master/%40vant2.x/commit_lint.md)

# 思路
![Image text](https://habaocdn.fuhuibao.club/flb/common/1605334507365up-e376d9ce548fd9132963a53840ddb3bade1.png)

**整体思路**：项目按照约定编写组件库代码、文档、demo)=>vant-cli处理.编译=》生成文档网站、组件库
# 整体架构
![Image text](https://habaocdn.fuhuibao.club/flb/common/1605334550761up-8d6086271867de3d95bdb2d9d6d425e6612.png)
