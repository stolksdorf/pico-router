const test = require('pico-check');

const React = require('react');
const render = (comp, props) => require('react-test-renderer').create(React.createElement(comp, props)).toJSON();

const Router = require('../pico-router.js');



test('undefined route names should throw', (t)=>{
	let unknownRoute;
	t.throws(()=>{
		const router = Router.createRouter({
			[unknownRoute] : true
		});
	})
});

test('wildcards should throw throw', (t)=>{
	t.throws(()=>{
		const router = Router.createRouter({
			'*' : true
		});
	})
});

test('not found routes should throw', (t)=>{
	t.throws(()=>{
		const router = Router.createRouter({
			'/test' : true
		});
		router.execute('/test2');
	})
});

test('trailing slashes work', (t)=>{
	const router = Router.createRouter({
		'/test' : true,
		'/test2/' : true
	});

	t.ok(router.execute('/test'))
	t.ok(router.execute('/test/'))

	t.ok(router.execute('/test2/'))
});

test('custom fallback should trigger', (t)=>{
	const router = Router.createRouter({
		'/test' : true,
	}, { fallback : (path)=>'fallback' });

	t.ok(router.execute('/test'));
	t.is(router.execute('/notFoundRoute'), 'fallback');
});

test.group('rendering', (test)=>{

	test('base', (t)=>{
		const routerComp = Router.createRouter({
			'/test' : React.createElement('div', {}, 'works')
		});

		let res = render(routerComp, {defaultUrl : '/test'});

		t.is(res.type, 'div');
		t.is(res.children[0], 'works');
	});

	test('missing route', (t)=>{
		const routerComp = Router.createRouter({
			'/test' : React.createElement('div', {}, 'works')
		});

		t.throws(()=>{
			let res = render(routerComp, {defaultUrl : '/nope'});
		})
	});


})


module.exports = test;