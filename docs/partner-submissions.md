# Institution submissions

Send `POST https://sedekah.je/api/institutions/submit` with a
`multipart/form-data` body. Let your HTTP client set the multipart boundary.

## Authentication

- **Partner:** send an issued API key in `x-api-key`. It must have the
  `submissions: ["create"]` permission. Invalid, disabled, or expired keys return
  `401` with `code: "invalid_api_key"`. A verified key identifies the partner
  account, independently of the credited submitter.
- **Signed-in user:** send the existing sedekah.je session cookie. Missing
  authentication returns `401`. When `x-api-key` is present, key authentication
  takes precedence; an invalid key does not fall back to a session.

Partner keys are intended for server-to-server requests. Do not expose them in
browser code. Key request limits and contributor submission limits can return
`429` with `code: "rate_limited"`. Contributor limits are checked before duplicate
lookup, so a duplicate request can receive `429` instead of `409`.

## Multipart fields

| Field | Contract |
| --- | --- |
| `name` | Required, nonempty institution name; trimmed. |
| `category` | Required: `masjid`, `surau`, `tahfiz`, `kebajikan`, or `lain-lain`. |
| `state` | Required Malaysian state/federal territory from the list below. |
| `city` | Required, nonempty; trimmed. |
| `qrImage` | Required nonempty image file, MIME type starting with `image/`, at most 5 MiB. |
| `submitterEmail` | Required for partners: valid email, at most 255 characters; trimmed and lowercased. Used for contributor attribution, never as proof of ownership. Ignored for session attribution. |
| `submitterName` | Required for partners: nonempty, at most 255 characters after trimming. Used when creating a contributor. |
| `qrContent` | Optional client-decoded content. Session requests can use it if server decoding fails. Partners must supply a server-readable QR image; otherwise receive `422`, `code: "unreadable_qr"`. |
| `sourceUrl` | Optional source reference; trimmed. |
| `address` | Optional address; trimmed. Missing addresses may be reverse geocoded. |
| `lat`, `lon` | Optional coordinates; supply both as finite numbers. Latitude must be between -90 and 90, longitude between -180 and 180. Missing coordinates may be geocoded. |

Accepted states: `Johor`, `Kedah`, `Kelantan`, `Melaka`, `Negeri Sembilan`,
`Pahang`, `Perak`, `Perlis`, `Pulau Pinang`, `Sabah`, `Sarawak`, `Selangor`,
`Terengganu`, `W.P. Kuala Lumpur`, `W.P. Labuan`, `W.P. Putrajaya`.

A banned credited submitter returns `403`, `code: "submitter_banned"`.
Invalid fields or images return `400`. Successful submissions return HTTP `200`
and enter review with pending status:

```json
{ "status": "success", "id": 123 }
```

## Duplicate QR responses

An exact QR-content match returns HTTP `409`. The existing `status`, `code`, and
`message` stay the same; `existingInstitution` is optional. Clients should continue
handling `duplicate_qr` when that field is absent.

An approved match includes its public name and canonical URL:

```json
{
  "status": "error",
  "code": "duplicate_qr",
  "message": "This QR code already exists in the system.",
  "existingInstitution": {
    "id": 42,
    "name": "Masjid Amanah",
    "status": "approved",
    "url": "https://sedekah.je/masjid/masjid-amanah"
  }
}
```

A pending match owned by the authenticated caller includes only its ID and status:

```json
{
  "status": "error",
  "code": "duplicate_qr",
  "message": "This QR code already exists in the system.",
  "existingInstitution": { "id": 43, "status": "pending" }
}
```

Partner ownership requires the stored `partnerId` to match the verified key's
user ID. Session ownership requires the stored `contributorId` to match the
signed-in user ID. Supplying a matching submitter email does not grant access.

Other pending matches and all rejected matches (including the caller's own)
return the generic response:

```json
{
  "status": "error",
  "code": "duplicate_qr",
  "message": "This QR code already exists in the system."
}
```

When several records match, approved records take precedence, then owned pending
records, then all others. Ties use the lowest institution ID. Public URLs use the
stored category normalized to the current categories (for example, `mosque`
becomes `masjid`, and `others` becomes `lain-lain`).

A duplicate response identifies an existing record. It does **not** guarantee
that the attempted submission previously succeeded or that its submitted name,
location, or other details were saved. Duplicate requests stop before image
upload, geocoding, database insertion, or Telegram notification.
