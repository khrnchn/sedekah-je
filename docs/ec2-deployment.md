# EC2 deployment runbook

This deployment moves only the Next.js web application to the shared EC2 host.
The production PostgreSQL database remains managed by Supabase. There is no
PostgreSQL, PgBouncer, Supavisor, or migration service in `compose.yaml`, and the
deployment workflow never runs schema migrations.

```text
Internet -> Cloudflare edge :443 -> Nginx origin :443 -> 127.0.0.1:3001 -> app :3000
                                                                    |
                                                                    +-> Supabase PostgreSQL
```

The loopback-only port avoids the sibling applications' host ports and prevents
direct access around the reverse proxy. Keep port `3001` closed in the EC2
security group. Only Cloudflare should reach the origin HTTP/HTTPS ports, and
the reverse proxy should be the application's only entry point.

## Audited shared-host baseline

The target EC2 instance was inspected read-only on 2026-08-30 before finalizing
this deployment:

- `127.0.0.1:3000` is Ellzaf, `0.0.0.0:3230`/`[::]:3230` is GetDoa, and no
  process or container is listening on `3001`. The Sedekah.je binding is
  therefore non-conflicting, and its explicit `127.0.0.1` host address is safer
  than GetDoa's current all-interface binding.
- The `r7i.large` host is `x86_64`, has 15 GiB RAM and 109 GiB free disk, and
  runs Docker Engine 26.1.3, Compose 2.27.1, AWS CLI v2, Python 3.12, and active
  Nginx. These satisfy the deployment's runtime prerequisites.
- Nginx currently listens only on port `80`; it has no Sedekah.je route and no
  origin TLS listener. `sedekah.je` still resolves to its existing Railway host.
- The attached `rizqradar-role` is currently denied
  `ssm:GetParametersByPath` for `/sedekah-je/prod`.
- The GitHub `production` environment currently has none of the required
  deployment secrets or variables.

The last three items are deliberate go-live blockers, not reasons to weaken the
workflow. Complete them and rerun every preflight below before merging. Also
remediate the shared host separately: its host firewall is inactive, GetDoa's
container reports unhealthy, and RizqRadar's public route currently returns
HTTP 502. Those sibling issues do not make port `3001` unsafe, but they are
important shared-host operational risks.

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
- The existing Nginx reverse proxy configured to forward `sedekah.je` to
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

An EC2 instance profile is a host-wide trust boundary, not a per-Compose-project
identity. Require IMDSv2 and use response hop limit `1` because none of this
host's application containers needs instance-role credentials; verify that
bridge-network containers cannot reach `169.254.169.254`. The host-side deploy
script can still use IMDS directly. Apply a `DOCKER-USER`/nftables metadata block
as defense in depth if the existing network policy does not already enforce it.
AWS recommends IMDSv2, documents the hop-limit tradeoff for containers, and AWS
Control Tower provides a control that caps the hop limit at one. References:
[EC2 metadata options](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-options.html)
and [EC2 Control Tower controls](https://docs.aws.amazon.com/controltower/latest/controlreference/ec2-rules.html).

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
HEALTH_URL                             # optional; set only after DNS cutover
```

Leave `HEALTH_URL` unset for the first EC2 deployment. Before DNS cutover it
would still reach Railway and produce a misleading successful proxy check. The
deploy script already gates on the new container's database-backed health check
and verifies its immutable image digest. Set `HEALTH_URL` to
`https://sedekah.je/api/health` after Cloudflare points at EC2 so subsequent
deployments also verify the public path.

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

## Owner checklist before merge

Do not merge the deployment PR until every applicable item below is complete.
None of these changes are made by the repository or its workflow.

- [ ] **EC2 role:** extend the attached instance profile with
  `ssm:GetParametersByPath` limited to
  `arn:aws:ssm:ap-southeast-5:254718381590:parameter/sedekah-je/prod/*`, plus
  `kms:Decrypt` limited to the specific customer-managed key if one protects the
  parameters. Confirm from EC2 that listing parameter *names* under the path no
  longer returns `AccessDeniedException`.
- [ ] **Instance metadata isolation:** in the EC2 console, require IMDSv2 and set
  the response hop limit to `1`; first confirm no sibling container legitimately
  consumes instance metadata. Verify the host AWS CLI still obtains its role and
  an unprivileged bridge-network container cannot obtain an IMDSv2 token. Add a
  persistent metadata-endpoint block for Docker networks as defense in depth.
- [ ] **Supabase URL:** this EC2 has no global IPv6 address or IPv6 route. Use
  Supavisor's IPv4 session-pooler URL on port `5432`, unless the Supabase project
  has the IPv4 add-on; do not deploy a local database or use transaction mode by
  default. Confirm the URL has `sslmode=require`.
- [ ] **SSM values:** create every required parameter listed above under
  `/sedekah-je/prod`; use `SecureString` for secrets, use exact uppercase
  basenames, and make the public/auth origins consistently `https://sedekah.je`.
- [ ] **GitHub environment:** create or use the exact lowercase `production`
  environment, restrict deployment branches to `main`, and add a required
  reviewer when the repository plan supports it. The similarly named existing
  deployment records are not substitutes for this environment's configuration.
- [ ] **GitHub secrets:** add `AWS_REGION=ap-southeast-5`, the OIDC deploy-role
  ARN, the exact `launch-wizard-1` security-group ID, the EC2 hostname, user
  `ubuntu`, app directory `/home/ubuntu/sedekah-je`, the SSH private key, a
  separately verified SSH host-key line, and SSM path `/sedekah-je/prod`.
- [ ] **SSH trust:** verify the EC2 ED25519 fingerprint through the AWS console
  or another trusted channel. The fingerprint observed during this audit was
  `SHA256:jxrxvrSAu2SwHEO0RgHNmjqKDwnqDAMrnYeuTsBBHsM`; do not generate the
  workflow's `known_hosts` value with an unauthenticated network scan.
- [ ] **GitHub build variables:** set `NEXT_PUBLIC_APP_URL=https://sedekah.je`,
  the production Turnstile site key, and the Google Maps API key if used. Leave
  `HEALTH_URL` unset until DNS has moved to EC2.
- [ ] **OIDC deploy role:** restrict trust to this repository and the
  `production` environment subject. Permit only the target security group's
  ingress authorization/revocation required for temporary runner `/32` SSH
  access. Do not create long-lived AWS access keys.
- [ ] **GHCR:** confirm the EC2 can pull the repository package without a
  write-capable credential. Use a public package for this public repository or a
  separately provisioned read-only token.
- [ ] **Nginx and origin TLS:** install and enable the Sedekah.je site below,
  provision a matching origin certificate, run `sudo nginx -t`, and reload only
  after validation. It is acceptable for the upstream to return 502 until the
  first container is deployed; sibling route files must remain untouched.
- [ ] **Cloudflare:** configure Full (strict), prepare proxied `sedekah.je` and
  `www` records for the EC2 origin, and restrict origin ports 80/443 to
  Cloudflare's current published IP ranges. Keep host port `3001` entirely out
  of the security group. Do not switch DNS before the first EC2 deployment and
  origin-specific health test.
- [ ] **Shared-host maintenance:** identify why GetDoa reports unhealthy and
  RizqRadar returns 502, review the 89 pending Ubuntu updates/reboot requirement,
  and confirm the EC2 security-group rules because the instance role could not
  read them and UFW is inactive. Schedule those remediations independently so
  they do not turn the Sedekah.je release into an unrelated shared-host change.

## First deployment and validation

1. Confirm the Nginx configuration, origin certificate, Cloudflare **Full
   (strict)** mode, and origin firewall rules before changing DNS. Cloudflare
   recommends Full (strict) and blocking direct origin traffic that does not
   come from Cloudflare or another explicitly trusted source.
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

The shared host uses Nginx. Terminate authenticated origin TLS there; do not copy
the siblings' current HTTP-only origin setup. Install either a publicly trusted
certificate or a Cloudflare Origin CA certificate whose SAN covers both names,
then use a dedicated site such as:

```nginx
server {
    listen 80;
    server_name sedekah.je www.sedekah.je;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name sedekah.je www.sedekah.je;

    ssl_certificate /etc/nginx/tls/sedekah.je.crt;
    ssl_certificate_key /etc/nginx/tls/sedekah.je.key;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Keep certificate material out of the repository. Validate the complete shared
configuration with `sudo nginx -t` before an atomic reload; never overwrite the
sibling routes. Restrict the EC2 security group for ports 80/443 to Cloudflare's
published origin-facing IP ranges, keep `3001` closed, and use short-lived `/32`
SSH access as the workflow does. References:
[Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/),
[protecting an origin](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/),
and [Nginx reverse proxy headers](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/).

Before DNS cutover, test the new origin explicitly so a successful response from
the existing Railway deployment cannot be mistaken for an EC2 validation:

```bash
curl --fail --resolve sedekah.je:443:43.217.8.220 \
  https://sedekah.je/api/health
```
