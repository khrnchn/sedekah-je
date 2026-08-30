# EC2 deployment runbook

This deployment moves only the Next.js web application to the shared EC2 host.
The production PostgreSQL database remains managed by Supabase. There is no
PostgreSQL, PgBouncer, Supavisor, or migration service in `compose.yaml`, and the
deployment workflow never runs schema migrations.

```text
Internet -> existing TLS reverse proxy :443 -> 127.0.0.1:3001 -> app :3000
                                                        |
                                                        +-> Supabase PostgreSQL
```

The loopback-only port avoids the sibling applications' host ports and prevents
direct access around the reverse proxy. Keep port `3001` closed in the EC2
security group. The existing reverse proxy should be the only public entry point.

## Supabase connection

Set `/sedekah-je/prod/DATABASE_URL` to the connection string copied from the
Supabase dashboard. For this long-lived EC2 container, use:

1. The direct connection on port `5432` when EC2 has working IPv6 egress or the
   Supabase project has the IPv4 add-on.
2. Otherwise, the shared Supavisor **session** pooler on port `5432` for an
   IPv4-only EC2 network.

Do not default to the shared transaction pooler on port `6543`; Supabase
documents that mode for temporary serverless and edge clients. Include
`sslmode=require` and verify connectivity from the EC2 host before the first
deployment. `DIRECT_URL` is only for deliberate operator-run maintenance and is
not fetched, used, or migrated by the deployment.

Reference: [Supabase database connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Host prerequisites

- A supported Docker Engine installation with Docker Compose v2.20.2 or newer.
- AWS CLI v2 and Python 3 available to root (the deployment script runs through
  `sudo`).
- The existing TLS reverse proxy configured to forward `sedekah.je` to
  `http://127.0.0.1:3001`, preserving the host and forwarding headers.
- At least the configured `1536m` memory limit plus headroom for Docker, the
  reverse proxy, and the three sibling projects. Measure actual host memory and
  lower or raise `SEDEKAHJE_MEMORY_LIMIT` intentionally.
- Outbound HTTPS for GHCR/AWS APIs and outbound PostgreSQL access to Supabase.
- A private application directory, normally `/home/ubuntu/sedekah-je`.

Next.js recommends putting a reverse proxy in front of a self-hosted server.
Use the proxy already operating on the shared host; do not start another public
proxy inside this Compose project. Reference:
[Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting).

## EC2 instance role

Attach an instance profile that can read only the production parameter path:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:GetParametersByPath",
      "Resource": "arn:aws:ssm:REGION:ACCOUNT_ID:parameter/sedekah-je/prod/*"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:REGION:ACCOUNT_ID:key/KEY_ID"
    }
  ]
}
```

The KMS permission is needed only for the customer-managed key protecting the
`SecureString` values. Do not grant access to a broader SSM path: AWS documents
that recursive `GetParametersByPath` access also exposes every descendant.
Reference: [AWS Parameter Store access controls](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-setting-up.html).

For new credential-management work, evaluate AWS Secrets Manager because AWS
currently recommends it for credentials requiring lifecycle and automatic
rotation. This deployment retains the shared host's SSM hierarchy and limits it
to one project path; changing stores should be a planned migration, not an
untested deployment-time workaround.

## Runtime parameters

Create these required values below `/sedekah-je/prod/`, using one parameter per
exact uppercase basename. Store credentials and tokens as `SecureString` values.

```text
DATABASE_URL
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_APP_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CLOUDFLARE_TURNSTILE_SECRET_KEY
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
```

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must use the same public origin.
`BETTER_AUTH_SECRET` must be at least 32 characters. Optional runtime values are
listed in `.env.example`. Telegram token, chat ID, and webhook secret must either
all be present or all be absent.

The deployment downloads parameters into mode-`0600` temporary files, validates
them, passes them to Compose, and removes them on exit. Root can still inspect a
container's environment, so restrict host administration and Docker socket
access to trusted operators.

## GitHub configuration

Create a protected GitHub environment named `production`, restrict it to
`main`, and require review if the repository's plan supports it. Put deploy-only
values in that environment.

Repository variables used while building the public client bundle:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY        # optional
```

Production environment variable:

```text
HEALTH_URL                             # optional; defaults to https://sedekah.je/api/health
```

Production environment secrets:

```text
AWS_REGION
AWS_ROLE_TO_ASSUME
AWS_INSTANCE_SG_ID
EC2_HOST
EC2_USER                               # optional; defaults to ubuntu
EC2_APP_DIR                            # optional; defaults to /home/ubuntu/sedekah-je
EC2_SSH_KEY
EC2_SSH_HOST_KEY
SSM_PARAMETER_PATH                     # optional; defaults to /sedekah-je/prod
```

Capture `EC2_SSH_HOST_KEY` through a trusted EC2 console or another authenticated
channel. Do not populate it from an unauthenticated `ssh-keyscan` during the
workflow. Make the repository's GHCR package readable by the EC2 host (public for
this public project, or configure a read-only registry credential separately).

The GitHub AWS role must trust this repository's `production` environment OIDC
subject and have only the security-group permissions used by the workflow. The
workflow uses short-lived OIDC credentials and grants the runner's `/32` access
to SSH only for the deployment. Reference:
[GitHub OIDC with AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
and [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

## First deployment and validation

1. Confirm the reverse proxy configuration and certificate before changing DNS.
2. On EC2, verify `curl -fsS http://127.0.0.1:3001/api/health` returns HTTP 200
   after the workflow finishes.
3. Verify `curl -fsS https://sedekah.je/api/health` through the public proxy.
4. Confirm `docker compose -f /home/ubuntu/sedekah-je/compose.yaml ps` reports
   the app healthy and that its image is a `ghcr.io/...@sha256:...` reference.
5. Exercise login, contribution upload, image delivery, moderation, and logout.
6. Watch container logs, EC2 memory/disk, reverse-proxy errors, and Supabase
   connection counts during the initial traffic window.

The deploy script waits for database-backed readiness and verifies the exact
image digest. If the new container cannot become healthy, it attempts to restore
the previous image (and previous compatible Compose file). A failed automatic
rollback exits non-zero and requires an operator to inspect:

```bash
cd /home/ubuntu/sedekah-je
sudo docker compose logs --tail 200 app
sudo docker compose ps
```

Never use `docker compose down --volumes` on the shared host. The app's named
volume contains only the disposable Next.js cache, but indiscriminate volume or
system pruning can remove data belonging to sibling projects.

## Updating the reverse proxy

The exact proxy syntax depends on the service already used by the three sibling
projects. The upstream must remain loopback-only. For example, the essential
Caddy route is:

```caddyfile
sedekah.je {
    reverse_proxy 127.0.0.1:3001
}
```

Validate and reload the existing proxy with its native command. Do not overwrite
the sibling projects' routes or restart the proxy without first validating the
complete shared configuration.
