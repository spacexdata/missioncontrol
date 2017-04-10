pluginHost.register(
    /**
     * provide a unique id for your plugin, this MUST be a url that you control
     * there does not need to be any content at the url, it is just an identifier
     * you can register multiple plugins, but they all need to have a different id
     */
    'github.com/spacexdata/missioncontrol/html/',

    /**
     * provide a factory for your plugin. It is eventually called with the "environment",
     * which contains dependencies you may use by destructuring the object. It contains:
     * - createElement (from React)
     * - createClass (from React)
     * - connect (from Redux)
     * - Util
     * - pluginId: the pluginId you provided above
     */
    ({pluginId, createElement, createClass, Util}) => ({
        view: ({config}) => {
            let html = {__html: config.html};
            return createElement('div',{
                dangerouslySetInnerHTML: html
            });
        }
    })
)
