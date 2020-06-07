const express = require('express');
const app = express();

const ERRORS = {
  0: '请求成功!',
  1: '权限验证失败',
  2: '服务器无响应',
  3: '无法找到资源',
  4: '当前请求数过多',
  5: '连接超时',
  6: '操作异常',
};

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  // res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/user', (req, res) => {
  const code = 0;

  res.json({
    code,
    message: ERRORS[code],
    data: {
      name: 'lxj',
      age: 18,
      sex: 1,
      local: 'zh',
      time: Date.now(),
    },
  });
});

app.get('/users', (req, res) => {
  const code = 0;

  res.json({
    code,
    message: ERRORS[code],
    data: [
      {
        name: 'lxj',
        age: 18,
        sex: 1,
        local: 'zh',
      },
      {
        name: 'zl',
        age: 18,
        sex: 2,
        local: 'zh',
      },
    ],
  });
});

app.get('/error', (req, res) => {
  const code = 6;

  res.status(200).json({
    code,
    message: ERRORS[code],
    data: null,
  });
});

app.get('/timeout', (req, res) => {
  const code = 0;

  setTimeout(() => {
    res.status(200).json({
      code,
      message: ERRORS[code],
      data: { type: 'timeout' },
    });
  }, 2000);
});

app.listen(3000, () => console.log('app listening on port 3000!'));
