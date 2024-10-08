# Alby Lite

A minimal Lightning address server powered by [NWC](https://nwc.dev)

## Development

- [Install Deno](https://docs.deno.com/runtime/manual/getting_started/installation/)
- Copy `.env.example` to `.env`
- Setup DB: `deno task db:migrate`
- Run in dev mode: `deno task dev`

### Creating a new migration

- Create the migration files: `deno task db:generate`
- The migration will automatically happen when the app starts.

### Running Tests

`deno task test`

## Deployment

### Run with Deno

`deno task start`

### Docker (from Alby's Container Registry)

`docker run -p 8080:8080 --pull always ghcr.io/getalby/lite:latest`

### Docker (from source)

`docker run -p 8080:8080 $(docker build -q .)`

### Deploy on Fly

Make sure to update the `app` name and `BASE_URL` in fly.toml, then run:

- `fly deploy`
