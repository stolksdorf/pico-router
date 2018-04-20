const React       = require('react');
const createClass = require('create-react-class');
const Pattern     = require('url-pattern');
const Url         = require('url');

const EVENT_NAME        = '__historyChange__';
const onBrowser         = (typeof window !== 'undefined');
const hasHistorySupport = !!(typeof window !== 'undefined' && window.history && window.history.pushState);
const isRegularClick    = (event)=>event.button === 0 && !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
const isExternalRoute   = (href) =>!!(href.match(/^https?\:/i) && !href.match(document.domain));

let handledRoutePatterns = [];

let Router = {
	navigate : (path, forceReload)=>{
		if(!onBrowser) return;
		if(hasHistorySupport && !forceReload){
			history.pushState({ isoPath: path }, null, path);
			window.dispatchEvent(new Event(EVENT_NAME));
		}
		window.location.href = path;
	},
	onUrlChange : (handler)=>{
		if(typeof window === 'undefined') return;
		window.addEventListener('popstate',handler);
		window.addEventListener(EVENT_NAME, handler);
	},
	removeListener : (handler)=>{
		if(typeof window === 'undefined') return;
		window.removeEventListener('popstate',handler);
		window.removeEventListener(EVENT_NAME, handler);
	}
};
Router.Link = createClass({
	getDefaultProps(){
		return {
			href : '',
			forceReload : false
		};
	},
	clickHandler(event){
		if(this.props.onClick) this.props.onClick(event);
		if(!isRegularClick(event) || isExternalRoute(this.props.href)) return;
		const doesRouteMatch = !!handledRoutePatterns.find((routePattern)=>routePattern.match(this.props.href));
		if(doesRouteMatch){
			Router.navigate(this.props.href, this.props.forceReload)
			event.preventDefault();
		}
	},
	render(){
		const newProps = Object.assign({}, this.props);
		delete newProps.forceReload;
		newProps.onClick = this.clickHandler;
		return React.createElement('a', newProps);
	},
});
Router.createRouter = (routes)=>{
	const RouteMap = Object.keys(routes).map((route)=>{
		const pattern = new Pattern(route);
		const handler = routes[route];
		handledRoutePatterns.push(pattern);
		return {
			pattern,
			handler : (typeof handler == 'function' ? handler : ()=>handler)
		}
	});
	return createClass({
		getDefaultProps() {
			return {
				scope      : this,
				defaultUrl : '/',
				nested     : false,
				forceUrl   : null
			};
		},
		match(path){
			const parsedUrl = Url.parse(path, true);
			const matchedRoute = RouteMap.find((route)=>route.pattern.match(parsedUrl.pathname));
			if(!matchedRoute) throw `Pico-router: Could not find matching route for '${path}'`;
			const args = matchedRoute.pattern.match(parsedUrl.pathname);
			return matchedRoute.handler.call(this.props.scope, args, parsedUrl.query, parsedUrl.hash, path);
		},
		componentDidMount(){
			if(hasHistorySupport) history.replaceState({ isoPath: window.location.pathname }, null);
			if(this.props.nested) return;
			Router.onUrlChange(this.handleUrlChange);
		},
		componentWillUnmount(){
			Router.removeListener(this.handleUrlChange);
		},
		handleUrlChange(){
			this.forceUpdate();
		},
		render(){
			let routeToMatch = window.location.href;
			if(!onBrowser)          routeToMatch = this.props.defaultUrl;
			if(this.props.forceUrl) routeToMatch = this.props.forceUrl;
			return this.match(routeToMatch);
		},
	});
};
module.exports = Router;