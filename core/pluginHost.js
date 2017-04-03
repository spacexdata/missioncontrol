class PluginHost {
    constructor() {
        this.plugins = {};
    }
    register(pluginId, factory) {
        this.plugins[pluginId] = {
            factory,
            url: document.currentScript.dataset.src
        };
    }
    init(env, pluginId) {
        console.log(Util.spread(env,{pluginId}));
        return Util.spread(
            this.plugins[pluginId].factory(Util.spread(env,{pluginId})),
            {url: this.plugins[pluginId].url, pluginId}
        );
    }
    initAll(env) {
        return Util.keys(this.plugins).map(this.init.bind(this, env)).reduce((index, spec) => {
            index[spec.url] = spec;
            return index;
        }, {});
    }
}

const pluginHost = new PluginHost();
