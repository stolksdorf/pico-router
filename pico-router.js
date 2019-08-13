const React       = require('react');
const Pattern     = require('url-pattern');
const Url         = require('url');

const map = (obj, fn)=>Object.keys(obj).map((key)=>fn(obj[key], key));

let ServerSideUrl = '/', eventHandlers = [], routers = [];

const onBrowser         = (typeof window !== 'undefined');
const hasHistorySupport = !!(typeof window !== 'undefined' && window.history && window.history.pushState);
const isRegularClick    = (event)=>event.button === 0 && !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
const isExternalRoute   = (href)=>!!(href.match(/^https?\:/i) && !href.match(document.domain));
const getUrl            = ()=>onBrowser ? window.location.pathname : ServerSideUrl;
const UpdateRouters     = ()=>{
	const routeIsHandled = routers.reduce((foundMatch, router)=>router.update(getUrl()) || foundMatch, false);
	eventHandlers.map((fn)=>fn());
	return routeIsHandled;
};

/* back-button event listener */
if(onBrowser) window.addEventListener('popstate', UpdateRouters);

const Router = {
	navigate : (path, forceReload = false)=>{
		if(!onBrowser) return false;
		if(hasHistorySupport && !forceReload && !isExternalRoute(path)){
			history.pushState({ isoPath : path }, null, path);
			if(UpdateRouters()) return true;
		}
		window.location.pathname = path;
		return false;
	},
	setServerSideUrl : (url)=>ServerSideUrl = url,
	onUrlChange      : (handler)=>eventHandlers.push(handler),
	removeListener   : (handler)=>eventHandlers.splice(eventHandlers.findIndex((h)=>h === handler), 1),
};

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

const CreateRouter = (routes, opts = {})=>{
	opts = Object.assign({ prefix : '' }, opts);

	const routeMap = map(routes, (handler, route)=>{
		if(route == 'undefined') throw `Pico-router: You have passed 'undefined' as a route pattern.\nCheck route for ${routes[route]}`;
		return {
			pattern : new Pattern(`${opts.prefix}${route}(/)`),
			handler : (typeof handler == 'function' ? handler : ()=>handler),
		};
	});
	const getMatch = (url)=>{
		const parsedUrl = (typeof url == 'string') ? Url.parse(url, true) : url;
		return routeMap.find((route)=>route.pattern.match(parsedUrl.pathname));
	};
	const execute = (url, scope)=>{
		const parsedUrl = (typeof url == 'string') ? Url.parse(url, true) : url;
		const matchedRoute = getMatch(parsedUrl);
		if(!matchedRoute) return null;
		return matchedRoute.handler.call(scope, {
			args : matchedRoute.pattern.match(parsedUrl.pathname),
			...parsedUrl,
		});
	};

	function RouterComponent({ scope = this, serverSideUrl = ServerSideUrl, forceUrl = false }){
		ServerSideUrl = serverSideUrl;
		const [routerId] = React.useState(()=>Symbol());
		const [url, setUrl] = React.useState(getUrl);
		React.useEffect(()=>{
			routers.unshift({
				id     : routerId,
				update : (url)=>{
					setUrl(url);
					return !!getMatch(routeMap, url);
				},
			});
			return ()=>routers = routers.filter((router)=>router.id !== routerId);
		}, []);
		return execute(forceUrl || url, scope);
	};

	RouterComponent.execute = execute;
	RouterComponent.routeMap = routeMap;

	return RouterComponent;
};

module.exports = {
	Link,
	CreateRouter,
	...Router,
};