const React = require('react');
const ReactDomServer = require('react-dom');

const { CreateRouter, Link, setServerSideUrl } = require('../pico-router.js');

const e = React.createElement;


const MainRouter = CreateRouter({
	'/'     : ()=>'yo',
	'/test' : ()=>'test',
	'/sub*' : (args)=>{
		//console.log(args);
		return e(SubRouter);
	},
}, { name : 'main', index : 0 });

const SubRouter = CreateRouter({
	''      : ()=>'sub',
	'/nest' : ()=>'sub-nest',
}, { prefix : '/sub', name : 'sub', index : 1 });



const Component = (props)=>{
	setServerSideUrl(props.url);
	console.log(props);
	return React.createElement('div', {},
		e(Link, { href : '/' }, 'root   '),
		e(Link, { href : '/test' }, '/test   '),
		e(Link, { href : '/sub' }, '/sub   '),
		e(Link, { href : '/sub/nest' }, '/sub/nest   '),
		e(Link, { href : 'https://www.google.com' }, 'external   '),
		e(Link, { href : '/oops' }, 'oop   '),
		e('div', {}, '---'),
		e(MainRouter, { name : 'main' })
	);
};

module.exports = {
	hydrate : (props)=>{
		ReactDomServer.hydrate(
			React.createElement(test.Component, props),
			document.getElementById('root')
		);
	},
	Component,
};