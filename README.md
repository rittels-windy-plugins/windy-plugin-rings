# windy-plugin-rings


This is a simple plugin that serves as a boilerplate for most of my plugins.  

In general,  I want to use the large right-hand pane for settings and to show a lot of information.   This pane can then be collapsed,  while the plugin is still active.  The plugin is then marked as `W.plugins['windy-plugin-xxx'].isActive` .  

The embedded box can be used to show important and minimal info while the rhpane is closed.   The embedded box also contains a list of active plugins,  so that one can switch between them.  

This allows one to use to use the flight planner  with the airspace plugin and the density altitude plugin,  for instance.

Clicking the `X` on the top right of the plugins,  cleans up completely and removes all the map layers.

I still use the picker,  by adding drag listeners,  and divs to the left or right of the picker.  I can make my own marker,  but since the picker is already there and familiar to users,  I prefer to use it.  

I created 2 internal plugins,  which are used by the main plugins:

- `windy-plugin-picker-tools`
- `windy-plugin-embedbox`

These have exports attached as 

`W.plugins['windy-plugin-picker-tools'].exports`

These are described in their respective repos.
