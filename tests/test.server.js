const express = require('express');
const app = express();
const browserify = require('browserify');


const ReactDOMServer = require('react-dom/server');
const React = require('react');

const TestClient = require('./test.client.js');
const render = (props, code)=>{
	const component = ReactDOMServer.renderToString(React.createElement(TestClient.Component, props));
	return `<html>
	<body><main id='root'>${component}</main></body>
	<script>${code}</script>
	<script>
		console.log(test);
		test.hydrate(${JSON.stringify(props)});
	</script>

	</html>`;
};


const bundle = ()=>{
	return new Promise((resolve, reject)=>{
		return browserify({ standalone : 'test' })
			.add('./tests/test.client.js')
			.bundle((err, buf)=>err ? reject(err) : resolve(buf.toString()));
	});
};

app.all('*', (req, res)=>{
	if(req.url == '/favicon.ico') return res.send('ok');
	bundle().then((code)=>{
		return res.send(render({ url : req.url }, code));
	});
});
app.listen(8000);
console.log('Pico-router test server running at localhost:8000');
