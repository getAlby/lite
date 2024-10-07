# Alby Lite

A minimal LNURL + Zapper service powered powered by [NWC](https://nwc.dev)

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

- `fly deploy`

## TODOs

- [ ] deploy on fly
- [ ] zapper support
- [ ] NIP-05 support
- [ ] invite links
