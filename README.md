# Alby Lite

A minimal LNURL + Zapper service powered powered by [NWC](https://nwc.dev)

## Development

- [Install Deno](https://docs.deno.com/runtime/manual/getting_started/installation/)
- Setup DB: `deno task db:migrate`
- Run in dev mode: `deno task dev`

### Creating a new migration

- Create the migration files: `deno task db:generate`
- Run the migration: `deno task db:migrate`

## Deployment

- `fly deploy`

## TODOs

- [ ] deploy on fly
- [ ] zapper support
- [ ] NIP-05 support
- [ ] invite links
