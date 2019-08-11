const React = require('react');

const { CreateRouter, Link, setServerSideUrl } = require('../pico-router.js');


const MainRouter = CreateRouter({
	'/'     : ()=>'yo',
	'/test' : ()=>'test',
	'/sub*' : (args)=>{
		//console.log(args);
		return <div> sub router <SubRouter /> </div>;
	},
	//'*' : ()=>'fallback'
}, { name : 'main', index : 0 });

const SubRouter = CreateRouter({
	''      : ()=>'sub',
	'/nest' : ()=>'sub-nest',
	//'*'     : ()=>'sub-fallback'
}, { prefix : '/sub', name : 'sub', index : 1 });

const Component = (props)=>{
	//setServerSideUrl(props.url);
	console.log(props);
	return <div>
		<Link href='/'>root</Link> <br />
		<Link href='/test'>/test</Link> <br />
		<Link href='/sub'>/sub</Link> <br />
		<Link href='/sub/nest'>/sub/nest</Link> <br />

		<Link href='/oops'>oops</Link> <br />
		<Link href='/sub/oops'>sub-oops</Link> <br />

		<Link href='https://www.google.com'>external</Link> <br />

		<hr />

		<MainRouter name='main' serverSideUrl={props.url} />

		<hr />

		<MainRouter name='main' />

		<hr />


	</div>

};

module.exports = Component