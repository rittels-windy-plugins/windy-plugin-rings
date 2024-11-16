# Windy Plugin Template

Template for development of Windy Plugins.

**Documentation at: [https://docs.windy-plugins.com/](https://docs.windy-plugins.com/)**

# CHANGELOG

-   3.0.0
    -   Updated `@windycom/plugin-devtools` for client v42.2.0
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
