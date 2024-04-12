
import plugins from '@windy/plugins';
import { installExternalPlugin } from '@windy/externalPlugins';

function loadReqPlugin(url, reqName) {
    if (plugins[reqName]) {
        let p = plugins[reqName];
        return p.isActive ? p.exports : p.open().then(() => p.exports);
    } else {
        return installExternalPlugin(url, 'url')
            .then(() => plugins[reqName].open())
            .then(() => plugins[reqName].exports);
    }
}

/** load plugins returns a promise which returns object { pickerT , embedbox } */
function loadPlugins() {
    const moduleLoadPromises = [
        loadReqPlugin(
            //'https://windy-plugins.com/214517/windy-plugin-picker-tools/0.1.0/plugin.min.js',
            'https://www.flymap.org.za/windy_plugins/pickertools/plugin.min.js?' + Date.now(),
            'windy-plugin-picker-tools',
        ),
        loadReqPlugin(
            'https://www.flymap.org.za/windy_plugins/embedbox/plugin.min.js?' + Date.now(),
            'windy-plugin-embedbox',
        ),
    ];

    return Promise.all(moduleLoadPromises).then(([pickerT, embedbox]) =>
        // pickerT only has to be active,  but embedbox must be open,  it may have been closed by another plugin
        plugins['windy-plugin-embedbox'].open().then(() => ({ pickerT, embedbox }))
    )
}

export { loadPlugins }