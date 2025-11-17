# Alby Lite

A minimal Lightning address server powered by [NWC](https://nwc.dev)

## API

### Authentication

Set the `API_KEY` environment variable in your `.env` file to a string of characters of your choice, to protect the `/users` endpoint. Include the API key in an `X-API-Key` header with each request.

If no `API_KEY` is present, it will default to open-access. This means that if the server is exposed to the Internet, anyone can create users in your database, with any name, with funds going to an NWC wallet of their choice.

### Create a Lightning Address

`POST /users`

```bash
curl -X POST https://your-domain.com/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "connectionSecret": "nostr+walletconnect://...",
    "nostrPubkey": "npubg3tal6y...",
    "username": "" // optional
  }'
```

Note: if a username is not provided, a random one will be generated.

`returns`

```json
{
    "lightningAddress": "91290133601@albylite.com"
}
```

## Development

- [Install Deno](https://docs.deno.com/runtime/manual/getting_started/installation/)
- Copy `.env.example` to `.env`
- Run in dev mode: `deno task dev`

### Creating a new migration

- Edit the schema (`./src/db/schema.ts`)
- Create the migration files: `deno task db:generate`
- The migration will automatically happen when the app starts.

### Running Tests

`deno task test`

## Deployment

### Configuration Parameters

- `LOG_LEVEL`: Sets the amount of detail in logs
- `BASE_URL`: Base url of the lightning address server
- `DATABASE_URL`: Postgres connection string
- `ENCRYPTION_KEY`: Secret used to encrypt NWC connection secrets in the DB
- `API_KEY`: Secret key for API authentication (required)
- `NOSTR_NIP57_PRIVATE_KEY`: private key of zapper service, see [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) for more info

_Environment variables must be setup, including a postgres database connection. Please see .env.example._

### Run with Deno

`deno task start`

### Docker (from Alby's Container Registry)

`docker run -p 8080:8080 --pull always ghcr.io/getalby/lite:latest`

### Docker (from source)

`docker run -p 8080:8080 $(docker build -q .)`

### Deploy on Fly

Make sure to update the `app` name and `BASE_URL` in fly.toml, then run:

- `fly launch`

_When launching, make sure to include a postgres database when setting up the app, then update your app environment variables with `fly secrets set`._
