# Auth flow

## Endpoints

- **Signup**: `POST /auth/signup`
- **Signin**: `POST /auth/signin`
- **Protected example**: `POST /users`

All endpoints are served from the API URL output by SST (`apiUrl`).

## Signup

Request:

```http
POST {apiUrl}/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Behavior:

- Creates a user in the Cognito User Pool using the provided email and password.
- If email confirmation is required in the pool settings, the user must confirm their account before signing in.

## Signin

Request:

```http
POST {apiUrl}/auth/signin
Content-Type: application/json

{
  "email": "cicig82493@dolofan.com",
  "password": "Abcd1234!"
}
```

Successful response body (shape):

```json
{
  "idToken": "eyJ...",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

Use `idToken` or `accessToken` as the bearer token when calling protected routes.

## Calling protected APIs

Example: create a user with `POST /users`:

```http
POST {apiUrl}/users
Content-Type: application/json
Authorization: Bearer {idToken-or-accessToken}

{
  "userId": "123",
  "name": "Alice",
  "email": "alice@example.com",
  "age": 30
}
```

Only requests with a valid JWT from the Cognito User Pool (for the configured client) will be allowed to call `POST /users`.

