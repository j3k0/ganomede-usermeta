Usermeta API
------------

Attach metadata to users.

## Configuration

 * `REDIS_AUTH_PORT_6379_TCP_ADDR`
 * `REDIS_AUTH_PORT_6379_TCP_PORT`
 * `REDIS_USERMETA_PORT_6379_TCP_ADDR`
 * `REDIS_USERMETA_PORT_6379_TCP_PORT`
 * `USERMETA_VALID_KEYS`
   * A comma-separated list of keys, restricting valid metadata keys.
   * _optional_

## /usermeta/v1/auth/:token/:key [POST]

Users' custom data. Valid metadata keys can be restricted using the `USERMETA_VALID_KEYS` environment variable.

Setting `USERMETA_VALID_KEYS` is recommended to prevent people from using your server as free storage. An additional self imposed limitation is that values can't be above 200 bytes.

### body (application/json)

    {
        "value": "..."
    }

(limited to 200 bytes)

### response [200] OK

## /usermeta/v1/auth/:token/:key [GET]

Alias for /usermeta/v1/:username/:key

## /usermeta/v1/:username/:key [GET]

Users' custom data.

### body (application/json)

### response [200] OK

    {
        "key": "some-key",
        "value": "..."
    }
