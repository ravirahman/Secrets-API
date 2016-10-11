# Secrets-API
Secrets-API provides a REST backend to store secret information in an encrypted form.

## Demo and API Documentation:
Documented endpoints (and an interactive demo) are available in the [Swagger UI](https://secrets-api.herokuapp.com)

_Note: After receiving a json web token (`jwt`) from login or signup, click the Authorize button (upper right corner) and enter `Bearer [jwt]` into the box (replace `[jwt]` with the actual json web token)_

### Brief Overview:
- Upon account creation, the server generates a random encryption key and envelope-encrypts the key with the user's password.
- Upon login, the server decrypts the envelope-encrypted encryption key with the user's password. It is then re-encrypted with a random password (stored in the database) and the server's secret. This server-decryptable form of the key is then  passed in the JSON Web Token so it can be used for subsequent operations during the same session.
- Secrets can be created/updated/read/deleted using standard CURD operations
- Upon logout, the random password is destroyed, so it is decrypt the encryption key and read user's data.

## Testing Considerations
- Used Test Driven Development (TDD) to evaluate functionality
- 45 Test cases are spread out across the [test](/test) directory to simulate the authentication flow and secret operations.
- It includes tests for scenarios that should result in both successful and erroneous responses.

## Getting Started
####Setup
- `git clone https://github.com/ravirahman/Secrets-API.git`
- `cd Secrets-API`
- `npm install`
- `export SERVER_SECRET=********`
- `export MONGO_DB_URI=mongodb://username:password@hostname:port/db`

####Build and Run
_Note that Secrets-API listens on the specified `PORT` below (using `http.createServer(app).listen(PORT)`).
`PROTOCOL`, `HOSTNAME`, and `LIVE_PORT` are used for `CORS` and `JWT` Audience / Issuer, not for running the actual server._
- (Optionally EXPORT the following environmental variables -- default values provided below)
    - `export PROTOCOL=http://`
    - `export HOSTNAME=localhost`
    - `export PORT=3000`
    - `export LIVE_PORT=PORT` (Defaults to `PORT`)
- `npm start`
- Visit [http://localhost:3000](http://localhost:3000) for the Swagger-UI (or the protocol/hostname/port combination specified via environmental variables)

####Test
_Note that testing will use the database specified above in `setup` and will run all the test cases in the [test](/test) directory
- `npm test`

## Design Considerations
- Used envelope encryption to allow for password changes without having re-encrypting all secrets
- Decided against client-side encryption (and SRP authentication) to allow for client-agnostic use via REST
- Only encrypts content of secret so the title is searchable
- 
## Future Improvements
- Implement secret-specific encryption key and permission structure to allow for sharing of secrets between accounts
- Search in encrypted fields (so both title and content can be encrypted)

## Core dependencies
- AES encryption is done via [node-cryptojs-aes](https://www.npmjs.com/package/node-cryptojs-aes).
- Web server is powered by [express](https://www.npmjs.com/package/express)
- MongoDB stores all data, and is interacted with via [mongoose](https://www.npmjs.com/package/mongoose)
- JSON web tokens for authentication, via [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) and [express-jwt](https://www.npmjs.com/package/express-jwt)
- Data validated by [swagger-express-middleware](https://www.npmjs.com/package/swagger-express-middleware) via the Swagger specification
- Demo is powered by [swagger-ui](https://www.npmjs.com/package/swagger-ui) 
- Test cases are executed by [mocha](https://www.npmjs.com/package/mocha) and [chai](https://www.npmjs.com/package/chai)
A full list is available in [package.json](./package.json)

## License
MIT