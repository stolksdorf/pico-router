const test = require('pico-check');
const Router = require('../pico-router.js');


test('undefined route names should throw', (t)=>{
	let unknownRoute;
	t.throws(()=>{
		const router = Router.createRouter({
			[unknownRoute] : ()=>console.log('hey')
		});
	})
})


module.exports = test;