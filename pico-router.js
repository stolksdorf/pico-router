const React = require('react');
const createClass = require('create-react-class');
const _ = require('lodash');
const Pattern = require('url-pattern');
const Url = require('url');

const onBrowser = (typeof window !== 'undefined');
const hasHistorySupport = !!(typeof window !== 'undefined' && window.history && window.history.pushState);
const handledRoutePatterns = [];

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
				window._onHistoryChange();
				return;
			}
			window.location.href = path;
		}
	},

	createRouter : function(routes){
		return createClass({
			getDefaultProps: function() {
				return {
					initialUrl : '/',
					scope : this,
					url : null  //Allows you to override the automatic currentUrl state
				};
			},
			getInitialState: function() {
				return {
					currentUrl : this.props.initialUrl
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
					if(args) return route.handler.call(this.props.scope, args, parsedUrl.query, parsedUrl.hash);
					return r;
				}, null);
			},
			componentDidMount: function() {
				window.onpopstate = function(evt){
					if (evt && evt.state && evt.state.isoPath) {
						window._onHistoryChange();
					}
				};
				window._onHistoryChange = function(){
					this.setState({ currentUrl : window.location.href })
				}

				// Fixes a Safari bug?
				if(hasHistorySupport) {
					history.replaceState({ isoPath: window.location.pathname }, null);
				}
			},
			render : function(){
				return this.match(this.props.url || this.state.currentUrl)
			},
		})
	}
};

module.exports = Router;