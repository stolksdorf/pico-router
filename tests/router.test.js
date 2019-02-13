const test = require('pico-check');
const Router = require('../pico-router.js');

const Pattern     = require('url-pattern');


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
})


module.exports = test;