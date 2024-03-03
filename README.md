# Windy Plugin Template

Template for development of Windy Plugins.

**Documentation at: [https://docs.windy-plugins.com/](https://docs.windy-plugins.com/)**

# CHANGELOG

-   2.0.0
    -   Completely new version of the plugin system based in Windy client v42+
-   1.0.0
    -   New rollup compiler, no more riot architecture
    -   Updated examples for Windy client v39
-   0.4.0
    -   Added `plugin-data-loader` to the Plugins API
-   0.3.0
    -   Examples moved to examples dir
-   0.2.0
    -   Fixed wrong examples
-   0.1.1
    -   Initial version of this repo

# NOTES

Few additions to the rollup.config :

- Do not use plugin.svelte,  rather name-of-the-plugin.svelte,  makes it easier to keep track when working on many plugins
- Added a rollup plugin to inject global css stylesheets,  can also be removed when plugin is closed.
- I prefer to keep `.less` file separate,  however, changes to `.less` file does not trigger a rebuild.  I created a hacky plugin to trigger rebuild,  this adds timestamp to @import file in svelte style tag.

Exports:

- Svelte plugins cannot export AFAICT,  so I add plugin[name].exports,  which can then be used by other plugins.
- Plugins can be loaded,  with a function like this,  which returns a promise with the exports:

```
function loadReqPlugin(url, name) {
        if (plugins[name] && (plugins[name].isActive || plugins[name].isOpen))
            return plugins[name].exports;
        // .open(),  does not remove other plugins from embed window
        return installExternalPlugin(url)
            .then(() => plugins[name].open())
            .then(() => plugins[name].exports);
    }
```
- I prefer to keep plugins active,  while the `rhpane` is closed,  I then mark the active plugin as ```.isActive = true```
- I add a function  `plugins[plugin].closeCompletely`  which then allows removal of all the listeneers and map elements.  

Embedded plugins

- I made a plugin `windy-plugin-embedbox` to send info in the embedded box.  This allows the use of both the `rhpane` and the `embedded` box.   WIP

