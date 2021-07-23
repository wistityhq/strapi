# getstarted

This is an example app you can run to test your changes quickly.

## Requirements

- Docker
- Docker compose
- Node

## Installation

By default once you have setup the monorepo you will be able to run the getstarted app with a sqlite DB directly.

If you wish to run the getstarted app with another database you can use the `docker-compose.dev.yml` file at the root of the directory.

### start the databases

Run the following command at the root of the monorepo

```
docker-compose -f docker-compose.dev.yml up -d
```

If you need to stop the running databases you can stop them with the following command:

```
docker-compose -f docker-compose.dev.yml stop
```

### run the getstarted app with a specific database

```
DB={dbName} yarn develop
```

The way it works is that the `getstarted` app has a specific `database.js` config file that will use the `DB` environment variable to setup the right database connection. You can look at the code [here](./config/database.js)

**Warning**

You might have some errors while connecting to the databases.
They might be coming from a conflict between a locally running database instance and the docker instance. To avoid the errors either shutdown your local database instance or change the ports in the `./config/database.js` and the `docker-compose.dev.yml` file.
