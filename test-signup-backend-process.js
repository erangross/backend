const http = require('http');
const fs = require('fs');

const email = 'test1@example.com';
const password = 'Mk!p93Mk!p93';
const confirmPassword = 'Mk!p93Mk!p93';

const data = {
  email: email,
  password: password,
  confirmPassword: confirmPassword
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify(data));
req.end();