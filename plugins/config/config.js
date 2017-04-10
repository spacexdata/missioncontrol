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
     * - createClass (from React)
     * - connect (from Redux)
     * - Util
     * - pluginId: the pluginId you provided above
     */
    ({pluginId, createElement, createClass, Util}) => {
        //TODO: move as actioncreators to core
        const adjustColumn = (index, pos) => ({
            type: 'core/adjustColumn',
            payload: {index, pos: pos+'px'}
        });
        const adjustRow = (index, pos) => ({
            type: 'core/adjustRow',
            payload: {index, pos: pos+'px'}
        });

        const Draggable = createClass({
            handleDown(e) {
                document.addEventListener('mousemove', this.handleDrag);
                document.addEventListener('mouseup', this.handleUp);
                e.preventDefault();
            },
            handleDrag(e) {
                this.props.onDrag(e);
                e.preventDefault();
            },
            handleUp(e) {
                document.removeEventListener('mousemove', this.handleDrag);
                document.removeEventListener('mouseup', this.handleUp);
                e.preventDefault();
            },
            render() {
                return createElement('div', Util.spread(this.props, {
                    className: this.props.className,
                    onMouseDown: this.handleDown.bind(this)
                }));
            }
        });

        const Col = Util.curry((dispatch, x, index) => {
            return createElement(Draggable, {
                className: 'layout-marker layout-col-marker',
                style: {left: x},
                onDrag: (e) => dispatch(adjustColumn(index, e.pageX))
            });
        });

        const Row = Util.curry((dispatch, y, index) => {
            return createElement(Draggable, {
                className: 'layout-marker layout-row-marker',
                style: {top: y},
                onDrag: (e) => dispatch(adjustRow(index, e.pageY))
            });
        });

        const Grid = ({layoutState, dispatch}) => {
            let cols = layoutState.cols.map(Col(dispatch));
            let rows = layoutState.rows.map(Row(dispatch));
            return createElement('div', {className: 'layout-grid'}, [].concat(cols, rows));
        }

        const View = ({box, config, configState, layoutState, state, dispatch, globalDispatch}) => {
            return createElement('div', {
                onClick: () => dispatch({type: 'toggleConfig'})
            }, ['configure view'].concat(
                state.open? createElement(Grid, {
                    layoutState,
                    configState,
                    dispatch: globalDispatch
                }): []
            ));
        }

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
             * optionally provide a stylesheet to be included
             */
            style: '/plugins/config/config.css',

            /**
             * a custom mapper for state properties that the root components receives.
             * use this for example to add global classes.
             */
            mapRootState: (state, props) => {
                console.log(props.className, state[pluginId].open);
                return Util.spread(props, {
                    className: props.className + (state[pluginId].open?' config-open':'')
                });
            },

            /**
             * optionally provide a reducer, which will be mounted as a slice of the main
             * reducer at the provided id
             */
            reducer: (state = {open: false}, {type, payload}) => {
                switch(type) {
                    case 'toggleConfig':
                        return Util.spread(state, {open: !state.open});
                    default: return state;
                }
            },

            /**
             * optionally provide a custom mapStateToProps function. By default,
             * you get your slice of the state
             */
            mapState: (state) => ({
                state: state[pluginId],     // own state
                configState: state.config,  // application config state
                layoutState: state.layout   // application layout state
            }),

            /**
             * optionally provide a custom mapDispatchToProps function. By default,
             * you get a dispatch that prefixes your action types with your plugin id
             */
            mapDispatch: (dispatch) => ({
                dispatch: ({type, payload}) => dispatch({type: pluginId+type, payload}),
                globalDispatch: dispatch
            }),

            /**
             * provide a view component, which is called with the following attributes:
             * - width: the width of the cell in pixels (determined by the user)
             * - height: the height of the cell in pixels (determined by the user)
             * - config: the user configuration for your plugin
             * - dispatch: the stores dispatch function
             * - state: your slice of the state
             */
            view: View
        }
    }
);
