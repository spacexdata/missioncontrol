const createElement = React.createElement;
const env = {
    createElement: React.createElement,
    createClass: React.createClass,
    connect: ReactRedux.connect,
    Util: Util
}

const initialState = {
    layout: {
        cols: ['calc(100% - 300px)'],
        rows: ['50%'],
        cells: {
            'hosted': [0,0,1,1],
            'technical': [1,0,2,1],
            'config': [1,1,2,2]
        }
    },
    config: []
};

const cellBox = (name, {cols, rows, cells}) => {
    let left = [].concat('0px', cols, '100%')[cells[name][0]];
    let top = [].concat('0px', rows, '100%')[cells[name][1]];
    let right = [].concat('0px', cols, '100%')[cells[name][2]];
    let bottom = [].concat('0px', rows, '100%')[cells[name][3]];
    return {
        left, top,
        width: `calc(${right} - ${left})`,
        height: `calc(${bottom} - ${top})`
    }
}

const defaultConfig = [{
//     url: 'plugins/youtube.js',
//     cell: 'hosted',
//     pluginConfig: {'youtube id': 'xsZSXav4wI8'}
// },{
//     url: 'plugins/youtube.js',
//     cell: 'technical',
//     pluginConfig: {'youtube id': 'xfNO571C7Ko'}
// },,{
    url: 'plugins/config.js',
    cell: 'config',
    pluginConfig: {}
}];

const MainView = ({children}) => createElement('div', {className: 'layout-canvas'}, children);

/**
 * wraps dispatch to dispatch actions under a namespace the plugin id namespace
 */
const wrapDispatch = (dispatch, {pluginId}) => ({
    dispatch: ({type, payload}) => dispatch({
        type: pluginId+type,
        payload
    })
});

const Cell = env.connect(
    state => ({layout: state.layout})
)(
    ({layout, pluginSpec, userConfig}) => {
        let box = cellBox(userConfig.cell, layout);
        let mapState = pluginSpec.mapState;// || (state, {pluginId}) => ({state: state[pluginId]});
        let mapDispatch = pluginSpec.mapDispatch || wrapDispatch;
        let pluginComponent = env.connect(mapState, mapDispatch)(pluginSpec.view);
        return createElement('div', {
            className: 'layout-cell',
            style: box
        }, createElement(pluginComponent, {
            config: Util.spread(pluginSpec.config, userConfig.pluginConfig),
            pluginId: pluginSpec.pluginId,
            box
        }));
    }
);

const layoutReducer = (state, action) => {
    switch (action.type) {
        case 'core/adjustRow':
            return Util.spread(state, {rows: [].concat(
                state.rows.slice(0, action.payload.index),
                action.payload.pos,
                state.rows.slice(action.payload.index+1)
            )});
        case 'core/adjustColumn':
            return Util.spread(state, {cols: [].concat(
                state.cols.slice(0, action.payload.index),
                action.payload.pos,
                state.cols.slice(action.payload.index+1)
            )});
    }
}

const mainReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'core/amendConfig':
            return Util.spread(state, {config: action.payload});
        case 'core/adjustRow':
        case 'core/adjustColumn':
            return Util.spread(state, {layout: layoutReducer(state.layout, action)});
        default:
            return state;
    }
}

const logger = store => next => action => {
    console.log(action);
    next(action);
    console.log(store.getState());
}

function initialize() {
    let config = Util.loadFromStorage('config', defaultConfig);
    let loadSrc = cfg => Util.load(cfg.url).then(() => cfg);


    //load the plugins
    Promise.all(Util.fmap(loadSrc, config)).then((res) => {
        console.log('loaded', res);
        let specs = pluginHost.initAll(env);
        console.log(specs);

        // let namespacedReducer = (pluginId, reducer) => ()

        let pluginsReducer = (state, action) => {
            return Util.keys(specs).reduce((state, url) => {
                let spec = specs[url];
                if (spec.reducer) {
                    return Util.spread(state, {
                        [spec.pluginId]: spec.reducer(state[spec.pluginId], {
                            type: action.type.replace(spec.pluginId, ''),
                            payload: action.payload
                        })
                    });
                } else {
                    return state;
                }
            }, state);
        }

        //create the store
        let store = Redux.createStore(
            Util.pipeReducers(mainReducer, pluginsReducer),
            Redux.applyMiddleware(logger)
        );

        store.dispatch({
            type: 'core/amendConfig',
            payload: config
        });

        let layout = store.getState().layout;
        //create views
        let views = config.map((userConfig, index) => {
            let pluginSpec = specs[userConfig.url];
            console.log(userConfig, pluginSpec);
            return createElement(Cell, {layout, userConfig, pluginSpec, key: index});
        });

        //init main view
        ReactDOM.render(createElement(
            ReactRedux.Provider,
            { store },
            createElement(MainView, {}, views)
        ), document.getElementById('view'));
    });

}
