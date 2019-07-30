export default {
  entry: ['src/index.js'],
  esm: 'rollup',
  // cjs: 'rollup',
  // umd: {
  //   globals: {
  //     // 'axios': 'axios',
  //     'lodash/get': '_.get',
  //   },
  //   name: 'request',  // 包的全局变量名
  //   minFile: true
  // },
  // umd: {
  //   globals: {
  //     jquery: '$'
  //   },
  //   name: 'Jquery',  // 包的全局变量名
  //   minFile: true
  // },
  runtimeHelpers: true,   // 一定要在 dependencies 里有 @babel/runtime 依赖

  // extractCSS: true,
  // extraBabelPresets: [], // 额外的 babel preset。
  // extraBabelPlugins: [], // 额外的 babel plugin。
  extraExternals: ['axios'],
  
  // target: 'browser', || node
  // doc: {
  //   title: 'use',
  //   dest: './docs',
  //   description: 'a react form validation hook',
    // theme: 'docz-theme-default',
    // logo: {
    //   src: '/path/of/my/logo',
    //   width: 150,
    // },
  // },
}