# Runbook

Operating <https://website.santoriello.ch>. This site is a static bundle behind
nginx behind traefik: there is no database, no backup to take and no state to
restore. Everything below is about the container and the edge in front of it.

Every command in this file that mentions the VPS is run on the VPS, over SSH,
from the deploy directory - the one GitHub Actions rsyncs into, held in the
`VPS_DEPLOY_PATH` secret. It contains `front/` and `docker-compose.yml`.

## Where the logs are

**Application logs** are nginx access and error logs from the container:

```bash
docker compose logs -f frontend          # follow
docker compose logs --tail=200 frontend  # recent
```

There are no application logs beyond that. The site is client-side JavaScript;
a runtime error appears in the visitor's browser console and nowhere else. In
particular, the three failure modes most likely to be reported as "the page is
broken" - a failed `fetch('/testimonials/testimonials.json')`, a failed
per-language `import()` of the team or news JSON, and a React render error -
all log to the browser console and leave no server-side trace at all. Ask for a
browser console screenshot before looking at the container.

**Edge logs** - TLS handshakes, certificate issuance, routing - belong to
traefik, not to this repository:

```bash
docker logs --tail=200 traefik
```

**Deploy logs** are in GitHub Actions, under the `Deploy React App` workflow:
<https://github.com/Santoriellor/laferme/actions/workflows/deploy.yml>

**Container health**:

```bash
docker compose ps
```

The `frontend` service declares a healthcheck that wgets
`http://127.0.0.1:8080/` every 15 seconds, so `docker compose ps` shows
`healthy` / `unhealthy` and not just `running`.

## Redeploying

The supported way to deploy is to push to `main`. That runs the tests, and only
then rsyncs and rebuilds. See [`technical.md`](technical.md).

To re-run a deploy without a new commit, use "Re-run all jobs" on the workflow
run in GitHub Actions.

To rebuild on the VPS by hand - for instance after editing a file there
directly, which the next rsync will overwrite:

```bash
cd "$VPS_DEPLOY_PATH"
docker compose build frontend
docker compose up -d frontend
```

`up -d` recreates the container from the newly built image. To restart the
existing container without rebuilding (which changes nothing about the served
files, since they are baked into the image):

```bash
docker compose restart frontend
```

To roll back, revert the commit and push. There is no image registry and no
tagged image to redeploy: `docker compose build` builds from the source that is
on the VPS at that moment, so "the previous version" only exists in git.

Because the deploy rsyncs with `--delete`, the VPS tree mirrors the repository.
Any file created on the server under `front/` and not in the repository is
removed by the next deploy.

## The site is down

Work in this order. Steps 1 and 2 take seconds and rule out the two most common
causes.

**1. Check the hostname you are testing.** Read the Hostnames section below
before anything else. The single most common false alarm on this site is
testing the wrong name.

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://website.santoriello.ch/
```

`200` means the site is up and the problem is elsewhere - a caching layer, the
reporter's DNS, or a client-side error that needs a browser console.

**2. Is the container running and healthy?**

```bash
docker compose ps
docker compose logs --tail=100 frontend
```

If it is `unhealthy` or restarting, the healthcheck cannot reach
`http://127.0.0.1:8080/` inside the container. That points at nginx: either it
failed to start, or `front/nginx.conf` no longer says `listen 8080`.

**3. Did nginx fail to start?** Check the logs from step 2 for a config parse
error. `front/nginx.conf` is copied to `/etc/nginx/conf.d/default.conf` at
build time, so a syntax error there is baked into the image and the container
exits immediately on every start.

**4. Is it a 502 from traefik?** A 502 means traefik answered but could not
reach the container. The three things that produce it:

- the container is down (step 2);
- the container is not on the `proxy-network` docker network;
- the port label and the listen directive disagree. They must both say 8080:
  `traefik.http.services.laferme-frontend.loadbalancer.server.port=8080` in
  `docker-compose.yml`, and `listen 8080;` in `front/nginx.conf`. The image is
  `nginxinc/nginx-unprivileged` and runs as uid 101, which cannot bind a port
  below 1024, so "just use 80" is not an available fix.

```bash
docker network inspect proxy-network | grep -i laferme
```

**5. Is it a 404 on every URL?** The build produced an empty or wrong
`build/` directory, or the copy into `/usr/share/nginx/html` failed. Check what
is actually in the image:

```bash
docker compose exec frontend ls /usr/share/nginx/html
```

`index.html` and `static/` must both be there.

**6. Did the last deploy actually succeed?** A red `test` job means
`build-and-deploy` never ran and the site is still serving the previous build -
which is the gate working as designed, not an incident. Check the workflow run
before assuming the deploy is at fault.

**7. Only now, look at certificates.** See the Hostnames section: a TLS error
on this VPS is far more often the wrong hostname than an expired certificate.

## Hostnames

> This repository is served at **`website.santoriello.ch`**. It is **not**
> served at `laferme.santoriello.ch`.
>
> `laferme.santoriello.ch` resolves to the VPS but has no traefik router behind
> it. A request to it fails with `curl` exit code 60 and HTTP status `000`.
> That looks exactly like an expired or invalid certificate and it is not: it
> is a hostname with nothing serving it, so traefik answers with its default
> certificate. This has already caused one false outage alarm.
> Before touching certificates, check that the hostname you tested is the one
> in `docker-compose.yml`.

The repository is called `laferme`, the GitHub project is `laferme`, the
container is `laferme-frontend` - and the hostname is `website`. That mismatch
is the whole reason this section exists.

The authoritative source is the router rule in `docker-compose.yml`:

```
traefik.http.routers.laferme-frontend.rule=Host(`website.santoriello.ch`)
```

If that label and the name you typed disagree, the label wins.

The two commands and what they return:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://website.santoriello.ch/   # expect 200
curl -sS -o /dev/null -w '%{http_code}\n' https://laferme.santoriello.ch/   # expect 000, exit 60 - this is normal
```

Both were verified on 2026-08-22. The second prints a certificate-trust error
naming an untrusted root, then `000`, then exits 60. That output is the
expected, healthy state of a hostname that nothing serves. **It is not an
incident and it is not something to fix.** Do not add a router, do not reissue
a certificate, and do not "correct" the hostname anywhere in this repository.

To confirm the diagnosis rather than the symptom, skip the certificate check
and read the status traefik actually returns:

```bash
curl -sSk -o /dev/null -w '%{http_code}\n' https://laferme.santoriello.ch/     # 404
```

`404` from traefik, with `X-Content-Type-Options: nosniff` and a 19-byte
`text/plain` body, is traefik saying "no router matches this Host". Verified on
2026-08-22. That is the proof: the TLS failure is a consequence of there being
no router, not a certificate problem of its own. Compare with the same command
against `website.santoriello.ch`, which returns `200` with or without `-k`.
