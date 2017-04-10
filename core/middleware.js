const middleware = {
    logger: store => next => action => {
        console.log(action);
        next(action);
        console.log(store.getState());
    },

    watcher: config => store => next => action => {
        let oldState = store.getState();
        next(action);
        let newState = store.getState();
        Util.keys(config).forEach((key) => {
            if (oldState[key] !== newState[key]) {
                config[key](newState[key], oldState[key]);
            }
        });
    }
}
