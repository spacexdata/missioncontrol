# Mission Control

This is a first draft of an integrated mission control experience for SpaceX launches. I am presenting this Hyperloop style as I don't have the resources to pull this off alone.

## Rationale

There are a lot of efforts capturing, analysing and visualising SpaceX mission data in one for or another. To name a few

- [/u/TheVehicleDestroyer](https://www.reddit.com/user/TheVehicleDestroyer) created flightclub
- live telemetry capturing
- There are [weather forecasts](http://www.patrick.af.mil/Portals/14/documents/Weather/L-2%20Forecast%2030%20Mar%20Launch.pdf?ver=2017-03-28-083516-783)
- [/u/Raul74Cz](https://www.reddit.com/user/Raul74Cz) creates [landing maps](https://www.google.com/maps/d/viewer?mid=1GwvMWuWyokeVZJWqy9nNMH_Pug4&ll=28.238947115344324%2C-78.13403097814569&z=6)
- [Spaceflight Now](https://spaceflightnow.com) has [live coverage streams](https://spaceflightnow.com/2017/03/24/ses-10-flight-preps/)
- [/u/veebay](https://www.reddit.com/user/veebay) created [flight analysis graphs](https://www.reddit.com/r/spacex/comments/6303ko/falcon_9_full_thrust_flight_analysis/)
- [/u/danielbigham](https://www.reddit.com/user/danielbigham) gathered [recovery data](https://www.reddit.com/r/spacex/comments/4ihp1p/f9024_recovery_thread/d2zwz5x/)
- [/u/ElongatedMuskrat](https://www.reddit.com/user/ElongatedMuskrat) provides (/r/spacex-) official [live updates](https://www.reddit.com/r/spacex/comments/62aqi7/rspacex_ses10_official_launch_discussion_updates/)
- [/u/ap0r](https://www.reddit.com/user/ap0r) made a [F9 systems overview](https://www.reddit.com/r/spacex/comments/64ew8x/falcon_9_a_systems_overview/) and [/u/Jef-F](https://www.reddit.com/user/Jef-F) proposed to creata a animated / interactive [version of it](https://www.reddit.com/r/spacex/comments/64ew8x/falcon_9_a_systems_overview/dg1tjip/)

(feel free to submit a PR to expand this list, I probably forgot quite some projects)

I'd like to combine this all into one, cockpit like mission control experience. One place (maybe multiple windows), that contains everything you'd ever want to know. Customizable, community-driven, expandable and free.

I do have quite some experience with creating single user interfaces out of disparate components. Some ground rules that I came up with are

- everybody should be able to provide data
- everybody should be able to build upon provided data
- end users should be able to choose which data to view
- end users should be able to customize the interface

The rest of this document will outline my plans. I can see three areas in which people can contribute and I like to keep thise technically separate.

- **data creation**: Pull data from other resources. Think of analysing /r/spacex sentiment, ocr-ing live telemetry, providing pre-calculated data, twitter streams, live wheather data (clouds, sea levels, wind) etc.
- **data manipulation**: This is creating derived data. Input is the data stream above, output is more data. Think filtering, averaging, calculating downrange distance from speed and altitude, integrations, differentiations, mappings, etc.
- **data visualization**: Plotting it all on the screen, basically one to one (if you need calculations, do that in the data manipulation part). Think maps, graphs, clocks, icons etc.

## Data creation.

Anyone can create data. You can do that by any means you like, using any programming language or tool you like.

To be able to use the data, we ask you to:

- put timestamped data on a message bus. and / or
- provide a json api (CORS enabled)

Some examples

- live telemetry ocr
- live readiness poll data, using voice recognition on the range radio channel
- analyise reddit comment rate, infer important milestones (lox loading, launch, meco etc) from that rate and use word frequency analysis to determine the type of event

## Data manipulation

Again, do this in any way you like. Get data from the message bus and put other data back on. Some examples:

- You created simulated data, but without timestamps. However, someone else created telemetry data and that comes in over the message bus. You can do a fast lookup using the 2nd stage speed and provide heating, Q and drag data.
- You are a math guru and you are able to calculate downrange distance, acceleration, and fuel levels from speed and altitude telemetry
- With the LOX and RP1 loading start timestamp, you can interpolate current fuel levels while loading

## Data visualization

Take data from the bus and current state and plot that. Some examples

- create graphs of physical properties
- create blinking lights for the readiness poll
- create a wheather update widget
- create (3D) maps of the flight path
- embed the spacex youtube stream
- provide a little SpaceX fm radio
- provide twitter feed from the official channel
- display reddit metrics

## Technical stuff.

So, how are we to pull this off? Let people create stuff independently, but provide a cohesive experience. I need to flesh this out a bit further, but here are the first ideas

### Message bus

publish stuff over a message bus. I propose using [mhub](https://github.com/poelstra/mhub), which is a small and simple message bus server. A thing we do need is a dedicated server with fixed address that people can use. Is there anyone willing to sponsor such a server?

With a server setup, anyone producing data (creating or manipulating) can post to the bus. This can be done in a variety of ways

- via the command line using mhub-client. Your application can just produce data on stdout and [pipe that into mhub-client](https://github.com/poelstra/mhub#mhub-client-commandline-interface).
- use any websocket library in your favorite language to connect to the message bus. [This is the protocol](https://github.com/poelstra/mhub#wire-protocol)
- use [MClient from a nodejs environment](https://github.com/poelstra/mhub#using-mhub-from-javascript)

Data MUST be published in a unique topic, to prevent collisions. That topic MUST be a url e.g. `www.example.com/fancydata` (doesn't have to be a real web address, as long as you control the domain)

Any data sent over the bus MUST at least contain a timestamp in iso 8601 zulu time and a unique id within the topic for that bit of data.

	{
		"timestamp":"2017-04-03T06:06:00.944Z"
		"uid":"12345"
		...
	}

With the topic and the uid, we can create a unique id for every message: `www.example.com/fancydata/12345`

With this, you can publish data after the fact and have it mapped to the correct time stamp. Also, you are able to publish corrections on the data (for example, if one data stream is the result of manual input, things may be corrected)

### Application architecture

I propose to create a React Redux application. This is well-know technology and easily expandable. Some important aspects.

- every bit of the interface is created in a separate react root
- state is stored in a Redux store
- a basic framework for layout is provided
- adding functionality is done via plugins

### Plugins

So, if you would like to create a piece of interface, create a js file (hosted anywhere) that eventually calls a pluginHost with unique id and a factory function. That factory is called with a bunch of useful stuff as an environment. You can pick out any depencencies you need. The factory should return an object describing your plugin

	window.pluginHost.register(
		'www.example.com/fancydata/graph',
		function({connect, dispatch, createElement, ...otherDependencies}) {
			return {
				name: 'fancydatagraph',
				reducer: (state, action) => state,
				view: createElement('div', [], 'my plugin')
			}
		}
	);

This plugin architecture is inspired by the [hyper.is extension api](https://hyper.is/#extensions-api). The idea is that you provide methods that hook into the applications.

These are the fields that your factory can provide:

- `name`: interface name for your plugin
- `config object optional`: a configuration object for your plugin. These are presented as configurable fields to the user. Keys will be used as labels, values as default valies. If you do not wish to provide default values (discouraged), provide null.
- `style string optional`: an optional link to a stylesheet file, which gets added to the page. Please namespace your classes.
- `mapRootState (state, props) => object optional`: additional props to provide to the root element. This may be used to pass in classes that act on your slice of the state.
- `reducer (state, action) => state optional`: a redux reducer. It is mounted as a slice of the main reducer at the provided id. Action types are received un-prefixed
- `mapState (state, props) => object optional`: optionally map the entire dashboard state (not just your slice) to props. By default, you receive just your own state as a `state` prop, but here you can override that behaviour. To access your own state slice, use `state[pluginId]`.
- `mapDispatch (dispatch, props) => object optional`: optionally provide your own dispatch mapper. By default, you receive a special version of `dispatch` as a prop that prefixes every action with your plugin id. This is normally invisible as the reducer un-prefixes it for you. This is done to prevent collisions. If you provide your own `mapDispatch`, it is called with a not-so-special global dispatch function.
- `view (props) => vnode optional`: a view for your component. It receives the following props:
	- `width`: the width of the cell in pixels, determined by the user
	- `height`: the height of the cell in pixels, determined by the user
	- `config`: the user configuration, which has the same shape and defaults as your provided `config` object
	- `dispatch`: a special dispatch function that prefixes your actions, unless you have overriden `mapDispatch`
	- `state`: your slice of the app state, unless you have overridden `mapState`

This section needs to be specced out a bit further, but the ideas are

- adding actions to mhub messages
- providing a custom redux reducer that is added to the main root reducer (in a namespaced way)
- providing middleware
- providing the view
- providing styles

Note that plugins can use any data from the store, 

### Customization

Hopefully there will be a *lot* of plugins available eventually. End users should be able to pick and place everything to their likings.

- plugins are maintained in a plugins file, that just lists urls to available plugins
- the user has the option to partition the interface and load plugins in any spot (maybe with css grid layout?)
