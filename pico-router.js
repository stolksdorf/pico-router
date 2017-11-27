const React = require('react');
const createClass = require('create-react-class');
const _ = require('lodash');
const Pattern = require('url-pattern');
const Url = require('url');

const onBrowser = (typeof window !== 'undefined');
const hasHistorySupport = !!(typeof window !== 'undefined' && window.history && window.history.pushState);
const handledRoutePatterns = [];

const EVENT_NAME = '__historyChange';

const Router = {
	Link : createClass({
		getDefaultProps: function() {
			return {
				href : '',
				forceReload : false
			};
		},
		isLeftClickEvent : function(event) {
			return event.button === 0;
		},
		isModifiedEvent : function(event) {
			return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
		},
		isExternal : function(){
			return !!(this.props.href.match(/^https?\:/i) && !this.props.href.match(document.domain));
		},
		clickHandler : function(event){
			if(this.props.onClick) this.props.onClick(event);
			if(this.isModifiedEvent(event) || !this.isLeftClickEvent(event) || event.defaultPrevented || this.isExternal()) return;

			const doesRouteMatch = _.some(handledRoutePatterns, (routePattern)=>routePattern.match(this.props.href))
			if(doesRouteMatch){
				Router.navigate(this.props.href, this.props.forceReload)
				event.preventDefault();
			}
		},
		render : function(){
			const newProps = Object.assign({}, this.props);
			delete newProps.forceReload;
			newProps.onClick = this.clickHandler;
			return React.createElement('a', newProps);
		},
	}),

	navigate : function(path, forceReload){
		if(onBrowser){
			if (hasHistorySupport && !forceReload) {
				history.pushState({ isoPath: path }, null, path);
				window.dispatchEvent(new Event(EVENT_NAME));
				return;
			}
			window.location.href = path;
		}
	},

	onUrlChange : function(handler){
		if(typeof window === 'undefined') return;
		window.addEventListener('popstate',handler);
		window.addEventListener(EVENT_NAME, handler);
	},
	removeListener : function(handler){
		if(typeof window === 'undefined') return;
		window.removeEventListener('popstate',handler);
		window.removeEventListener(EVENT_NAME, handler);
	},

	createRouter : function(routes){
		return createClass({
			getDefaultProps: function() {
				return {
					scope      : this,
					defaultUrl : '/',
					nested     : false,
					forceUrl   : null
				};
			},
			routeMap : _.map(routes, function(handler, route){
				const pattern = new Pattern(route);
				handledRoutePatterns.push(pattern);
				return {
					pattern : pattern,
					handler : (_.isFunction(handler) ? handler : function(){ return handler })
				}
			}),
			match : function(path){
				const parsedUrl = Url.parse(path, true);
				return _.reduce(this.routeMap, (r, route)=>{
					if(r) return r;
					const args = route.pattern.match(parsedUrl.pathname);
					if(args) return route.handler.call(this.props.scope, args, parsedUrl.query, parsedUrl.hash, path);
					return r;
				}, null);
			},
			componentDidMount: function() {
				if(hasHistorySupport) history.replaceState({ isoPath: window.location.pathname }, null);
				if(this.props.nested) return;
				Router.onUrlChange(this.handleUrlChange);
			},
			componentWillUnmount: function() {
				Router.removeListener(this.handleUrlChange);
			},
			handleUrlChange : function(){
				this.forceUpdate();
			},
			render : function(){
				if(this.props.forceUrl) return this.match(this.props.forceUrl);
				if(!onBrowser) return this.match(this.props.defaultUrl);
				return this.match(window.location.href);
			},
		})
	}
};

module.exports = Router;