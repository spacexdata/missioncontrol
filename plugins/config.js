pluginHost.register(
    /**
     * provide a unique id for your plugin, this MUST be a url that you control
     * there does not need to be any content at the url, it is just an identifier
     * you can register multiple plugins, but they all need to have a different id
     */
    'github.com/spacexdata/missioncontrol/config/',

    /**
     * provide a factory for your plugin. It is eventually called with the "environment",
     * which contains dependencies you may use by destructuring the object. It contains:
     * - createElement (from React)
     * - connect (from Redux)
     * - Util
     * - pluginId: the pluginId you provided above
     */
    ({pluginId, createElement, Util}) => {
        console.log(pluginId);
        return {
            name: 'configuration',

            /**
             * optionally provide a config object. Keys will be used as labels to the user
             * you receive the actual user config back in the view as attribute
             * When you don't provide a default value (which is discouraged), use null
             */
            config: {
                
            },

            /**
             * optionally provide a reducer, which will be mounted as a slice of the main
             * reducer at the provided id
             */
            reducer: (state = {foo:'bar'}, {type, payload}) => {
                switch(type) {
                    case 'openConfig':
                        return Util.spread(state, {open: true});
                    default: return state;
                }
            },

            /**
             * optionally provide a custom mapStateToProps function. By default,
             * you get your slice of the state
             */
            mapState: (state) => ({
                state: state[pluginId],
                configState: state.config
            }),

            /**
             * provide a view component, which is called with the following attributes:
             * - width: the width of the cell in pixels (determined by the user)
             * - height: the height of the cell in pixels (determined by the user)
             * - config: the user configuration for your plugin
             * - dispatch: the stores dispatch function
             * - state: your slice of the state
             */
            view: ({box, config, configState, state, dispatch}) => {
                console.log(state, config);
                return createElement('div', {
                    onClick: () => dispatch({type: 'openConfig'})
                }, 'configure view');
            }
        }
    }
);
