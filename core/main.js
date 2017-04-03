const createElement = React.createElement;
const env = {
    createElement: React.createElement,
    connect: ReactRedux.connect,
    Util: Util
}

const initialState = {
    layout: {
        cols: ['0px','calc(100% - 300px)','100%'],
        rows: ['0px', '50%', '100%'],
        cells: {
            'hosted': [0,0,1,1],
            'technical': [1,0,2,1],
            'config': [1,1,2,2]
        }
    },
    config: []
};

const cellBox = (name, {cols, rows, cells}) => {
    let left = cols[cells[name][0]];
    let top = rows[cells[name][1]];
    let right = cols[cells[name][2]];
    let bottom = rows[cells[name][3]];
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

const mainReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'core/amendConfig':
            return Util.spread(state, {config: action.payload});
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

        let pluginsReducer = (state, action) => {
            return Util.keys(specs).reduce((state, url) => {
                let spec = specs[url];
                if (spec.reducer) {
                    return Util.spread(state, {
                        [spec.id]: spec.reducer(state[spec.id], {
                            type: action.type.replace(spec.id, ''),
                            payload: action.payload
                        })
                    });
                } else {
                    return state;
                }
            }, state);
        }

        //create the store
        let store = Redux.createStore((state, action) => {
            let intermediate = mainReducer(state, action);
            return pluginsReducer(intermediate, action);
        }, Redux.applyMiddleware(logger));

        store.dispatch({
            type: 'core/amendConfig',
            payload: config
        });

        //create views
        let views = config.map(userConfig => {
            let pluginSpec = specs[userConfig.url];
            console.log(userConfig, pluginSpec);
            return createElement(Cell, {userConfig, pluginSpec});
        });

        //init main view
        ReactDOM.render(createElement(ReactRedux.Provider, {
            store
        }, createElement(MainView, {}, views)), document.getElementById('view'));
    });

}
