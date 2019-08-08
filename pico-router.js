const React       = require('react');
const Pattern     = require('url-pattern');
const Url         = require('url');

const EVENT_NAME        = '__historyChange__';
const onBrowser         = (typeof window !== 'undefined');
const hasHistorySupport = !!(typeof window !== 'undefined' && window.history && window.history.pushState);
const isRegularClick    = (event)=>event.button === 0 && !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
const isExternalRoute   = (href)=>!!(href.match(/^https?\:/i) && !href.match(document.domain));
const isHandledRoute    = (href)=>!!handledRoutePatterns.find((routePattern)=>routePattern.match(href));
const useForceUpdate = ()=>{
	const [value, set] = React.useState(true);
	return ()=>set(!value);
};


const handledRoutePatterns = [];

const Router = {
	navigate : (path, forceReload)=>{
		if(!onBrowser) return;
		if(hasHistorySupport && !forceReload && !isExternalRoute(path)){
			history.pushState({ isoPath : path }, null, path);
			window.dispatchEvent(new Event(EVENT_NAME));
			return;
		}
		window.location.href = path;
	},
	onUrlChange : (handler)=>{
		if(typeof window === 'undefined') return;
		window.addEventListener('popstate', handler);
		window.addEventListener(EVENT_NAME, handler);
	},
	removeListener : (handler)=>{
		if(typeof window === 'undefined') return;
		window.removeEventListener('popstate', handler);
		window.removeEventListener(EVENT_NAME, handler);
	},
};

function Link({ href, onClick, forceReload = false, ...props }){
	return React.createElement('a', Object.assign({
		onClick : (evt)=>{
			if(onClick) onClick(evt);
			if(!isRegularClick(evt) || isExternalRoute(href)) return;
			const doesRouteMatch = isHandledRoute(href);
			if(doesRouteMatch){
				Router.navigate(href, forceReload);
				evt.preventDefault();
			}
		},
		href,
	}, props));
};

const createRouter = (routes, opts = {})=>{
	opts = Object.assign({
		fallback : (path)=>{ throw `Pico-router: Could not find matching route for '${path}'`; },
		preifx   : '',
	}, opts);

	const routeMap = Object.keys(routes).map((route)=>{
		route = opts.prefix + route;
		if(route == '*') throw 'Pico-router: Wild card route matching should be handled server-side';
		if(route == 'undefined') throw `Pico-router: You have passed 'undefined' as a route pattern.\nCheck route for ${routes[route]}`;
		const pattern = new Pattern(`${route}(/)`);
		const handler = routes[route];
		handledRoutePatterns.push(pattern);
		return {
			pattern,
			handler : (typeof handler == 'function' ? handler : ()=>handler),
		};
	});

	const execute = (path, scope = this)=>{
		const parsedUrl = Url.parse(path, true);
		const matchedRoute = routeMap.find((route)=>route.pattern.match(parsedUrl.pathname));
		if(!matchedRoute) return opts.fallback(path);
		const args = matchedRoute.pattern.match(parsedUrl.pathname);
		return matchedRoute.handler.call(scope, args, parsedUrl.query, parsedUrl.hash, path);
	};

	function RouterComponent({ scope = this, defaultUrl = '/', nested = false, forceUrl = null }){
		const forceUpdate = useForceUpdate();
		const handleUrlChange = ()=>forceUpdate();
		React.useEffect(()=>{
			if(hasHistorySupport) history.replaceState({ isoPath : window.location.pathname }, null);
			if(nested) return;
			Router.onUrlChange(handleUrlChange);
			return ()=>Router.removeListener(handleUrlChange);
		}, []);

		const getUrl = ()=>{
			if(forceUrl) return forceUrl;
			if(onBrowser) return window.location.href;
			return defaultUrl;
		};
		return execute(getUrl());
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