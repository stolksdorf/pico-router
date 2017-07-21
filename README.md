# pico-router
An incredibly tiny React router for isomorphic apps. **Under 110 lines of code**

[![NPM](https://nodei.co/npm/pico-router.png)](https://nodei.co/npm/pico-router/)

*Goal* : pico-router was made to quickly bootstrap your project with a easy to understand and agnostic implementation of an isomorphic React router.
If you need to make modifications or add features, it's easy to understand what's happening under the hood and make tweaks.
As your project grows, it's easy to swap out to another more full-featured router implementation.

**Features**

* **Under 110 lines of code**
* Very easy route -> function mapping
* Uses [url-pattern](https://www.npmjs.com/package/url-pattern)-style url matching
* Works on both client and server
* Uses history pushstate for instant page transitions
* Included Link component (anchor tag replacement) to use history pushstate

**Anti-Features** (features removed to reduce complexity)

* No nested route matching
* No built-in redirects
* If pushstate isn't supported it *does not* fall back to hash fragments. Falls back to standard anchor tag behaviour.



### Example main.jsx
```jsx
const React = require('react');
const createClass = require('create-react-class');
const CreateRouter = require('pico-router').createRouter;
const Link = require('pico-router').Link;

const UserPage = require('./user.jsx');
const HomePage = require('./home.jsx');
const SearchPage = require('./search.jsx');

const Router = CreateRouter({
	'/' <HomePage />,
	'/search' : function(args, query){
		return <SearchPage term={query.q} />
	},
	'/user/:id' : function(args){
		return <UserPage userId={arg.id} />
	}
});

module.exports = createClass({
	getDefaultProps: function() {
		return {
			url : '/'
		};
	},
	render : function(){
		return <div className='main'>
			<nav>
				<Link href='/'>Home</Link>
				<Link href='/search' forceReload={true}>Search</Link>
			</nav>
			<Router defaultUrl={this.props.url} />
		</div>
	},
})
```

### `pico-router.createRouter(routeMap)`

`routeMap` is a key-value object where the keys are [url-pattern](https://www.npmjs.com/package/url-pattern)-style
routes and the values are either React components or functions that return React components.

Returns a React component that will render to one of the passed in components in the current url matches any of the keys. Once mounted, the router component will update itself and re-render whenever the `history.pushState` changes.

```javascript
const Router = CreateRouter({
	'/' <HomePage />,
	'/search' : function(args, query){
		return <SearchPage term={query.q} />
	},
	'/user/:id' : function(args){
		return <UserPage userId={arg.id} />
	}
});

//...

	render : function(){
		return <div className='main'>
			<Router defaultUrl={this.props.url} />
		</div>
	}
});

```

Functions passed in the `routeMap` will be passed `args`, `query`, `hash`, and `url` as parameters. `args` and `query` are objects; `hash` and `url` is a string.

```javascript
	//url -> '/users/fred/details?q=adv#main'
	'/users/:id/:page' : function(args, query, hash, url){
		//args -> {id : 'fred', page : 'details'}
		//query -> {q : 'adv'}
		//hash -> '#main'
		//url -> '/users/fred/details?q=adv#main'
	}
```

### `<Router />`
Creating a router will return a React component that is used in your `render` function. The router can take 4 additional props:

```javascript
<Router
	scope={this}       // Used as the scope for the route ampping functions. Useful if your route mapping needs props or state
	defaultUrl={'/'}   // When not being rendered on the browser, this defines what url it should use.
	nested={true}      // Nesting routers can run into race conditions with events firing. If you have a router rendering another router, the child router should have the nested prop set as true
	forceUrl={'/test'} // Always forces the given url
/>

```


### `pico-router.Link`

`Link` is a wrapper for the standard anchor tag that, on click, will try to use `history.pushState` first to update the url. Renders exactly to a `<a></a>` and falls back to default behaviour whenever needed. Replace any `<a>` in your app to make the link an instant page transition.

If you wish to force standard behaviour, eg. a page reload, pass the prop `forceReload={true}`

```javascript
<Link href='/update' forceReload={true}>Update Page</Link>
```

### `pico-router.navigate(path, forceReload)`

If you need to update the url using `history.pushState` you can use this. It will trigger the router to rerender. Pass `true` as the second parameter to force the browser to reload at the path given.