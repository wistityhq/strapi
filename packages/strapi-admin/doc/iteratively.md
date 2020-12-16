# Tracking events with Iteratively

Strapi uses [Iteratively](https://iterative.ly/) to define, instrument, and validate events tracked to Strapi's analytics service.

Learn more about Iteratively [here](https://iterative.ly/docs/getting-started).

## Installation

This is how Strapi was set up with Iteratively:

- `itly init`
- `itly pull --path ./packages/strapi-admin/admin/src/itly strapi-admin`

The `pull` command codegen's a strongly-typed analytics SDK that matches Strapi's tracking plan. Events that are associated with the `strapi-admin` source will be included.

When the tracking plan is updated, call `itly pull` to update the local tracking library.

> Note: `itly init` and `itly pull` update a local Itly configuration file called `.itlyrc`. This file gets checked in along with the Itly tracking library so all team members share the same Itly state and settings.

## Loading Itly

To load Itly, `itly.load()` gets called once when the application first initializes. For the admin console, this happens in `packages/strapi-admin/admin/src/app.js`.

A set of properties that should be added to all events is provided as `context` in the `itly.load()` call. At the moment, `projectType` is the only context property.

Also provided to `itly.load()` is a custom Iteratively plugin that receives clean, validated data from Iteratively and sends them to Strapi's analytics server.

A loaded Itly instance is made available to the rest of the Strapi application via the global context (see `<GlobalContextProvider>` in `packages/strapi-admin/admin/src/containers/Admin/index.js`).

## Tracking Events

To track events, call `itly.eventName()` using the event's name. For example, to track the `didInitializeAdministration` event, call `itly.didInitializeAdministration()`.

## Custom Destination

Strapi sends events to a custom analytics endpoint. An Iteratively plugin for this endpoint is located at `packages/strapi-admin/admin/src/telemetry-plugin.js`. The plugin creates a payload containing the following fields and posts it to `https://analytics.strapi.io/track`:

- `event` (the event's name)
- `properties` (the event's properties)
- `id` (the event's ID)
- `version` (the event's version)
- `uuid` (the Strapi app ID)

> Note: `id` and `version` are used by the Strapi analytics endpoint to validate the event against its schema.

### Verifying Events

To verify that all events are instrumented in the application, call `itly verify`. To report the instrumentation status back to the tracking plan (typically as part of a CI job), run `itly verify -u`. See [docs](https://iterative.ly/docs/integrating-with-ci).
