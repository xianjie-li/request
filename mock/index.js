const express = require('express');
const app = express();

const ERRORS = {
  0: '请求成功',
  1: '权限验证失败',
  2: '服务器无响应',
  3: '无法找到资源',
  4: '当前请求数过多',
  5: '连接超时',
};

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/user', (req, res) => {

  res.json({
    code: 0,
    message: ERRORS[0],
    data: {
      name: 'lxj',
      age: 18,
      sex: 1,
      local: 'zh',
    }
  });
});

app.listen(3000, () => console.log('app listening on port 3000!'));