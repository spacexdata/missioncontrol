pluginHost.register(
    /**
     * provide a unique id for your plugin, this MUST be a url that you control
     * there does not need to be any content at the url, it is just an identifier
     * you can register multiple plugins, but they all need to have a different id
     */
    'github.com/spacexdata/missioncontrol/youtube/',

    /**
     * provide a factory for your plugin. It is eventually called with the "environment",
     * which contains dependencies you may use by destructuring the object. It contains:
     * - createElement (from React)
     * - connect (from Redux)
     */
    ({createElement}) => ({
        name: 'youtube video',

        /**
         * optionally provide a config object. Keys will be used as labels to the user
         * you receive the actual user config back in the view as attribute
         * When you don't provide a default value (which is discouraged), use null
         */
        config: {
            'youtube id': 'xsZSXav4wI8'
        },

        /**
         * provide a view component, which is called with the following attributes:
         * - width: the width of the cell in pixels (determined by the user)
         * - height: the height of the cell in pixels (determined by the user)
         * - config: the user configuration for your plugin
         */
        view: ({box, config}) => createElement('iframe', {
            width: '100%',
            height: '100%',
            src: "https://www.youtube.com/embed/" + config['youtube id'],
            frameBorder: 0,
            allowFullScreen: true
        })
    })
);
