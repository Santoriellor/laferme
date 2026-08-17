[![Deploy](https://github.com/Santoriellor/laferme/actions/workflows/deploy.yml/badge.svg)](https://github.com/Santoriellor/laferme/actions/workflows/deploy.yml)

# laferme

Static marketing site for La Ferme. React (create-react-app), served by nginx.

Live: <https://website.santoriello.ch>

## Running locally

```bash
cd front
npm ci
npm start
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which rsyncs `front/` and
`docker-compose.yml` to the VPS and rebuilds the container there. Traefik terminates TLS.

The container runs nginx unprivileged as uid 101 on port 8080.

## Tests

There are none yet. `front/src/setupTests.js` is jest configuration only.
