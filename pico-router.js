const React       = require('react');
const Pattern     = require('url-pattern');
const Url         = require('url');

//TODO: REMOVE FALLBACK COMPLETELY
//TODO: HANDLE NO ROUTE FOUND EVER


const map = (obj, fn)=>Object.keys(obj).map((key)=>fn(obj[key], key));
//const reduce = (obj, fn, init)=>Object.keys(obj).reduce((a, key)=>fn(a, obj[key], key), init);

//const EVENT_NAME        = '__historyChange__';
const onBrowser         = (typeof window !== 'undefined');
const hasHistorySupport = !!(typeof window !== 'undefined' && window.history && window.history.pushState);
const isRegularClick    = (event)=>event.button === 0 && !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
const isExternalRoute   = (href)=>!!(href.match(/^https?\:/i) && !href.match(document.domain));
//const isHandledRoute    = (href)=>!!handledRoutePatterns.find((routePattern)=>routePattern.match(href));
// const useForceUpdate = ()=>{
// 	const [value, set] = React.useState(true);
// 	return ()=>set(!value);
// };


//const handledRoutePatterns = [];
let ServerSideUrl = '/';

const getUrl = ()=>onBrowser ? window.location.pathname : ServerSideUrl;

//todo: maybe set a global fallback?

const Router = {
	navigate : (path, forceReload)=>{
		if(!onBrowser) return;
		if(hasHistorySupport && !forceReload && !isExternalRoute(path)){
			history.pushState({ isoPath : path }, null, path);

			//FIXME: I need to figure out how fallbacks will work
			//

			if(UrlChangeHandler()) return; //If it ran successfully, stop
		}
		window.location.pathname = path;
	},
	// onUrlChange : (handler)=>{
	// 	if(typeof window === 'undefined') return;
	// 	window.addEventListener('popstate', handler);
	// 	window.addEventListener(EVENT_NAME, handler);
	// },
	// removeListener : (handler)=>{
	// 	if(typeof window === 'undefined') return;
	// 	window.removeEventListener('popstate', handler);
	// 	window.removeEventListener(EVENT_NAME, handler);
	// },
	setServerSideUrl : (url)=>ServerSideUrl = url,
};

const routers = [];


// const UrlChangeHandler = ()=>{
// 	const bestRouter = routers.find((router)=>hasMatch(router.routes, getUrl()));
// 	if(bestRouter){
// 		bestRouter.update(getUrl());
// 		return true;
// 	}
// 	return false;
// };

const UrlChangeHandler = ()=>{
	routers.map((router)=>router.update(getUrl()));
	return true;
};


if(onBrowser){
	window.addEventListener('popstate', UrlChangeHandler);
}

//const setServerSideUrl = (url)=>ServerSideUrl=url

function Link({ href, onClick, forceReload = false, ...props }){
	return React.createElement('a', Object.assign({
		onClick : (evt)=>{
			if(onClick) onClick(evt);
			if(!isRegularClick(evt) || isExternalRoute(href)) return;
			Router.navigate(href, forceReload);
			evt.preventDefault();
		},
		href,
	}, props));
};

// const findValidRouter = (href)=>{
// 	return routers.find((router)=>hasMatch(router.routes, getUrl()));
// };

//const regRouters = [];

//on create add router to list
// add the router instance based on the router index, and keyed by new symbol
//


//on mount add to list, on unmount remove
// find router


// On new route
// walk backward throuhg the router indexes
// on first match re-render
//

const hasMatch = (routeMap, path)=>{
	const parsedUrl = Url.parse(path, true);
	return routeMap.find((route)=>route.pattern.match(parsedUrl.pathname));
};

const hasRouter = (routerId)=>{
	return !!routers.find((r)=>r.id == routerId);
};


const id = 0;

const createRouter = (routes, opts = {})=>{
	opts = Object.assign({
		fallback : (path)=>{ throw `Pico-router: Could not find matching route for '${path}'`; },
		prefix   : '',
	}, opts);

	//regRouters.push(opts.name);

	const routeMap = map(routes, (handler, route)=>{
		//const fullroute = opts.prefix + route;

		//TODO: allow wildcard with opt
		//if(route == '*') throw 'Pico-router: Wild card route matching should be handled server-side';
		if(route == 'undefined') throw `Pico-router: You have passed 'undefined' as a route pattern.\nCheck route for ${routes[route]}`;
		const pattern = new Pattern(`${opts.prefix}${route}(/)`);
		//handledRoutePatterns.push(pattern);
		return {
			pattern,
			handler : (typeof handler == 'function' ? handler : ()=>handler),
		};
	});

	//TODO: does this have to be outside?
	const execute = (path, scope = this)=>{
		const parsedUrl = Url.parse(path, true);
		// const matchedRoute = routeMap.find((route)=>route.pattern.match(parsedUrl.pathname));
		// //use match here

		const matchedRoute = hasMatch(routeMap, parsedUrl);

		if(!matchedRoute) return null;

		//if(!matchedRoute) return opts.fallback(path);
		//console.log('MATCH', matchedRoute, matchedRoute.handler);
		const args = matchedRoute.pattern.match(parsedUrl.pathname);
		return matchedRoute.handler.call(scope, { args, path, ...parsedUrl });
	};

	function RouterComponent({ scope = this, nested = false, forceUrl = null }){
		const [routerId] = React.useState(()=>{
			console.log('CREATING NEW SYMBOL');
			//return id++;
			return Symbol(opts.name);
		});

		const [url, setUrl] = React.useState(getUrl);

		//TODO: Instead save the execution Function


		//const registered = React.useRef(false);

		// console.log('------------------------');
		// console.log('START RENDER', opts.name, hasRouter(routerId));

		// console.log('onbrowser', onBrowser, onBrowser ? getUrl() : '');
		// console.log('using url', url);

		//TODO: possibly move this into the on mount
		if(!hasRouter(routerId)){
			console.log('adding ', routerId, opts.name);
			routers.unshift({
				id     : routerId,
				//name   : opts.name,
				routes : routeMap,
				//index  : opts.index || 0,
				update : (url)=>{
					console.log('calling force', opts.name);
					setUrl(url);
					//forceUpdate();
				},
			});
		}

		console.log('routers', routers);


		// if(registered.current == false){
		// 	console.log('adding ', routerId, opts.name);
		// 	console.log(registered);
		// 	routers.unshift({
		// 		id     : routerId,
		// 		//name   : opts.name,
		// 		routes : routeMap,
		// 		//index  : opts.index || 0,
		// 		render : (url)=>{
		// 			console.log('calling force', opts.name);
		// 			setUrl(url);
		// 			//forceUpdate();
		// 		},
		// 	});
		// 	registered.current = true;
		// }

		//console.log(routerId);
		//const forceUpdate = useForceUpdate();
		//const handleUrlChange = ()=>forceUpdate();
		React.useEffect(()=>{
			//console.log(opts.name);
			//console.log(opts);


			// if(Object.getOwnPropertySymbols(routers).length !== 0 && typeof opts.index === 'undefined'){
			// 	throw `Pico-router: Declare multiple routers without specifying index values.`;
			// }
			//console.log('adding ', routerId, opts.name);
			// routers.unshift({
			// 	id     : routerId,
			// 	//name   : opts.name,
			// 	routes : routeMap,
			// 	//index  : opts.index || 0,
			// 	render : (url)=>{
			// 		console.log('calling force', opts.name);
			// 		setUrl(url);
			// 		//forceUpdate();
			// 	},
			// });
			//console.log(routers);


			//console.log('regRouters', routers);
			//console.log('size', Object.values(routers), routers);
			//console.log('size2', Object.getOwnPropertySymbols(routers).length);
			//console.log('render', name);
			//if(hasHistorySupport) history.replaceState({ isoPath : getUrl() }, null);
			//if(nested) return;
			//Router.onUrlChange(handleUrlChange);
			return ()=>{
				//console.log('unrender');
				//Router.removeListener(handleUrlChange);

				//todo: change to .findIndex()
				//const idx = routers.reduce((acc, router, idx)=>router.id == routerId ? idx : acc);
				//console.log('remove idx', idx);
				routers.splice(routers.findIndex((router)=>router.id === routerId), 1);
				//delete routers[idx];
				console.log(routers, routers.length);

				//registered.current = false;
			};
		}, []);

		// const getUrl = ()=>{
		// 	if(forceUrl) return forceUrl;
		// 	return onBrowser
		// 		? getUrl()
		// 		: ServerSideUrl;
		// };
		//console.log('-------------');
		//console.log(getUrl(), routeMap);
		//console.log(execute(getUrl()));

		//return execute(getUrl());
		console.log('is reg', opts.name, hasRouter(routerId));
		console.log('END RENDER ', url, opts.name);
		console.log('----------------------');
		return execute(url);
	};

	RouterComponent.execute = execute;
	RouterComponent.routeMap = routeMap;

	return RouterComponent;
};

//allow set of a server-side url to use
// so you don't have to pass the url down.


module.exports = {
	createRouter,
	Link,
	CreateRouter : createRouter,
	...Router,
};