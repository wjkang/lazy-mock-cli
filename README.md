A simple CLI for [lazy-mock](https://github.com/wjkang/lazy-mock).

### 安装

``` bash
$ npm install -g lazy-mock
```

### 使用

``` bash
$ lazy-mock init <template-name> <project-name>
```

例子:

``` bash
$ lazy-mock init d2-admin-pm my-project
```
在 my-project 目录下执行 npm install

### 目前支持模板
* [rbac](https://github.com/lazy-mock-templates/simple) - 包含 RBAC 权限控制模型
* [d2-admin-pm](https://github.com/lazy-mock-templates/d2-admin-pm) - 包含 [d2-admin-pm](https://github.com/wjkang/d2-admin-pm) 的 curd 模板

### 自定义模板

第三方模板使用：
``` bash
$ lazy-mock init  username/repo my-project
```

定制模板查看 [lazy-mock](https://github.com/wjkang/lazy-mock) 文档
