const ReactDOMServer = require('react-dom/server'), React = require('react'), browserify = require('browserify');

const pack = (bundler)=>new Promise((res, rej)=>bundler.bundle((err, buf)=>err ? rej(err) : res(buf.toString())));
const getBundler = (componentPath, opts = {})=>{
	return browserify({ standalone : 'Root', cache : {}, ...opts }).external('react').require(componentPath)
		.transform('babelify', { presets : ['@babel/preset-react'] });
};
let libs;
const render = async (bundler, props)=>{
	const bundle = await pack(bundler);
	if(!libs) libs = await pack(browserify().require(['react', 'react-dom']));
	return `<html>
	<body><main id='root'>${ReactDOMServer.renderToString(React.createElement(eval(`module=undefined;${bundle};global.Root`), props))}</main></body>
	<script>${libs};${bundle}</script>
	<script>require('react-dom').hydrate(require('react').createElement(Root, ${JSON.stringify(props)}),document.getElementById('root'));</script>
	</html>`;
};
const build = async (componentPath, props = {})=>render(getBundler(componentPath, props), props);



const express = require('express');
const app = express();

app.all('*', (req, res)=>{
	if(req.url == '/favicon.ico') return res.send('ok');
	build('./tests/test.client.jsx', {url : req.url}).then((code)=>{
		return res.send(code);
	});
});
app.listen(8000);
console.log('Pico-router test server running at localhost:8000');
