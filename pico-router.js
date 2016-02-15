var React = require('react');
var _ = require('lodash');
var Pattern = require('url-pattern');
var Url = require('url');

var onBrowser = (typeof window !== 'undefined');
var hasHistorySupport = !!(typeof window !== 'undefined' && window.history && window.history.pushState);
var handledRoutePatterns = [];

var Router = {
	Link : React.createClass({
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
			var self = this;
			if(this.props.onClick) this.props.onClick(event);
			if(this.isModifiedEvent(event) || !this.isLeftClickEvent(event) || event.defaultPrevented || this.isExternal()) return;

			var doesRouteMatch = _.any(handledRoutePatterns, function(routePattern){
				return routePattern.match(self.props.href)
			});
			if(doesRouteMatch){
				Router.navigate(this.props.href, this.props.forceReload)
				event.preventDefault();
			}
		},
		render : function(){
			var newProps = Object.assign({}, this.props);
			newProps.onClick = this.clickHandler;
			return React.createElement('a', newProps)
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
		return React.createClass({
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
				var pattern = new Pattern(route);
				handledRoutePatterns.push(pattern);
				return {
					pattern : pattern,
					handler : (_.isFunction(handler) ? handler : function(){ return handler })
				}
			}),
			match : function(path){
				var self = this;
				var parsedUrl = Url.parse(path, true);
				return _.reduce(this.routeMap, function(r, route){
					if(r) return r;
					var args = route.pattern.match(parsedUrl.pathname);
					if(args) return route.handler.call(self.props.scope, args, parsedUrl.query, parsedUrl.hash);
					return r;
				}, null);
			},
			componentDidMount: function() {
				var self = this;
				window.onpopstate = function(evt){
					if (evt && evt.state && evt.state.isoPath) {
						window._onHistoryChange();
					}
				};
				window._onHistoryChange = function(){
					self.setState({ currentUrl : window.location.href })
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