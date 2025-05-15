# Avatar App

[![CI](https://github.com/reddysteady/avatar-app/actions/workflows/ci.yml/badge.svg)](https://github.com/reddysteady/avatar-app/actions/workflows/ci.yml)

Backend for an AI-driven avatar application.

## Running locally

To run the application locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the example environment file and configure as needed:
   ```
   cp .env.example .env
   ```

3. Start the server:
   ```
   npm start
   ```

The server will be available at http://localhost:3000 with a health check endpoint at `/healthz`.

## Development

- The server is located in the `server/` directory
- Configuration is managed through environment variables (see `.env.example`)
- Run tests with `npm test`

## API Endpoints

- `GET /healthz` - Health check endpoint that returns "pong"