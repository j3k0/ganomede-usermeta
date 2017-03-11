Usermeta API
------------

Attach metadata to users.

## Configuration

 * `API_SECRET` — secret to compare to for internal access level
 * keys (all are required, any key that is not specified is considered internal, pass empty string for `[]`):
   * `USERMETA_PUBLIC_KEYS` — comma-separated list of keys (public read, token write)
   * `USERMETA_PROTECTED_KEYS` — comma-separated list of keys (token read, token write)
   * `USERMETA_PRIVATE_KEYS` — comma-separated list of keys (token read, secret write)
   * `USERMETA_MAX_LENGTH` (optional, default `200`) — max byte length of token-writable keys (those that don't require API_SECRET to be written)
 * `REDIS_AUTH_PORT_6379_TCP_ADDR` — authdb redis hostname
 * `REDIS_AUTH_PORT_6379_TCP_PORT` — authdb redis port
 * `REDIS_USERMETA_PORT_6379_TCP_ADDR` — meta redis hostname
 * `REDIS_USERMETA_PORT_6379_TCP_PORT` — meta redis port

Reading and writing different keys requires different access levels:

  * public (read anyone, write token);
  * protected (read token, write token);
  * private (read token, write API_SECRET);
  * internal (read API_SECRET, write API_SECRET).

Keys that are not listed in env vars can't be read or written.

## `GET /:userIds/:keys`

Retrieve publicly available metadata. Both, `:userIds` and `:keys` are comma-separated list. Attach `secret` query string param to retrieve fields up to internal.

Missing or unknown keys, and those you are not allowed to read will be omitted (as opposed to being HTTP error).

### response [200] OK (application/json)

Suppose `country` is public key and `email` is a protected one.

`GET /alice,bob/country,email` results in following JSON response:


``` json
  { "alice": {"country": "USA"},
    "bob": {"country": "France"}
  }
```

## `GET /auth/:token/:keys`

Retrieve `public`, `protected` and `private` keys for a user with login token equal `:token`. Make `:token` be `"API_SECRET.${userId}"` to retrieve fields up to `internal`.

Missing or unknown keys, and those you are not allowed to read will be omitted (as opposed to being HTTP error).

### response [200] OK (application/json)

Suppose `country` is public key, `email` is a protected one, and `internalId` is internal one.

`GET /auth/alice-auth-token/country,email,internalId` results in following JSON response:


``` json
  { "alice": {
      "country": "USA",
      "email": "alice@wonderland.com"
    }
  }
```

### response [401] Not Authorzied

In case of invalid token.

## `POST /auth/:token/:key`

Write `public` and `protected` meta value to a `:key` of a user `:token` points to. Make `:token` be `"API_SECRET.${userId}"` to write fields up to `internal` and no byte limit.

### body (application/json)

JSON with single key `"value"` and value being a string.

``` json
 { "value": "string to write as a meta value"
 }
```

### response [200] OK
### response [401] Not Authorzied

In case of invalid token, trying to write `private` and up without `API_SECRET`, or unknown key.

``` json
 { "restCode": "InvalidCredentialsError",
   "statusCode": 401,
   "message": "Invalid credentials"
 }
```

### response [413] Payload Too Big

In case of writing `public` or `protected` value of byte size greater than `USERMETA_MAX_LENGTH` env var without `API_SECRET`.

``` json
 { "restCode": "ValueTooBigError",
   "statusCode": 413,
   "message": "Value exceeds ${USERMETA_MAX_LENGTH} byte limit"
 }
```
