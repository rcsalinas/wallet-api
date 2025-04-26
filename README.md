# Wallet API

A backend API for managing users and their wallets.  
**Tech stack:** Express.js (Node.js), TypeScript, PostgreSQL.

---

## Features

-   User authentication (sign-in, sign-out) with JWT.
-   Secure password hashing.
-   CRUD operations for user wallets.
-   Validation and robust error handling.
-   Users can only manage their own wallets.

---

## Requirements

-   Node.js (>=16)
-   npm (>=8)
-   Docker (recommended for PostgreSQL)
-   PostgreSQL (if not using Docker)

---

## Setup & Installation

1. **Clone the repository**

    ```sh
    git clone <your-repository-url>
    cd wallet-api
    ```

2. **Install dependencies**

    ```sh
    npm install
    ```

3. **Environment variables**

    Create a `.env` file in the project root:

    ```
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wallet_api
    JWT_SECRET=your_super_secret_jwt
    ```

4. **Run PostgreSQL using Docker**  
   _(If you already have PostgreSQL, skip this step)_

    ```sh
    docker run --name wallet-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wallet_api -p 5432:5432 -d postgres
    ```

5. **Database Migration**

    Create a file called `init.sql` with the following schema:

    ```sql
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tag VARCHAR(100),
      chain VARCHAR(50) NOT NULL,
      address VARCHAR(255) UNIQUE NOT NULL
    );
    ```

    Load the schema:

    ```sh
    docker exec -i wallet-postgres psql -U postgres -d wallet_api < init.sql
    ```

6. **Run the server**

    ```sh
    npm run dev
    ```

    > The API should be available at [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

### Authentication

#### POST `/api/signin`

Sign in a user and get a JWT token.

-   **Request body:**
    ```json
    {
    	"email": "user@example.com",
    	"password": "yourpassword"
    }
    ```
-   **Response:**
    ```json
    {
    	"token": "jwt_token_here"
    }
    ```
-   **Errors:**
    -   400: Missing email or password
    -   401: Invalid credentials

---

#### POST `/api/signout`

Sign out a user (requires JWT).

-   **Headers:**  
     `Authorization: Bearer <jwt_token_here>`
-   **Response:**
    ```json
    { "message": "Signed out" }
    ```

---

### Wallets CRUD

**All wallets endpoints require authentication via JWT.**

#### GET `/api/wallets`

Retrieve all wallets for the authenticated user.

-   **Headers:**  
     `Authorization: Bearer <jwt_token_here>`
-   **Response:**
    ```json
    [
    	{
    		"id": "uuid",
    		"user_id": "uuid",
    		"tag": "Personal Wallet",
    		"chain": "Ethereum",
    		"address": "0x123abc..."
    	}
    ]
    ```

---

#### POST `/api/wallets`

Create a new wallet for the authenticated user.

-   **Headers:**  
     `Authorization: Bearer <jwt_token_here>`
-   **Body:**
    ```json
    {
    	"tag": "Savings Wallet", // Optional
    	"chain": "Ethereum", // Required
    	"address": "0xabc123..." // Required (must be unique)
    }
    ```
-   **Response:**
    ```json
    {
    	"id": "uuid",
    	"user_id": "uuid",
    	"tag": "Savings Wallet",
    	"chain": "Ethereum",
    	"address": "0xabc123..."
    }
    ```
-   **Errors:**
    -   400: Missing required fields or address already exists

---

#### GET `/api/wallets/:id`

Retrieve details of a specific wallet (must belong to the authenticated user).

-   **Headers:**  
     `Authorization: Bearer <jwt_token_here>`
-   **Response:**
    ```json
    {
    	"id": "uuid",
    	"user_id": "uuid",
    	"tag": "Savings Wallet",
    	"chain": "Ethereum",
    	"address": "0xabc123..."
    }
    ```
-   **Errors:**
    -   404: Wallet not found or not owned by user

---

#### PUT `/api/wallets/:id`

Update a wallet owned by the user.

-   **Headers:**  
     `Authorization: Bearer <jwt_token_here>`
-   **Body:** (supply only the fields you want to update)
    ```json
    {
    	"tag": "Work",
    	"chain": "Polygon",
    	"address": "0x987de...." // If updated, must still be unique
    }
    ```
-   **Response:**
    ```json
    {
    	"id": "uuid",
    	"user_id": "uuid",
    	"tag": "Work",
    	"chain": "Polygon",
    	"address": "0x987de...."
    }
    ```
-   **Errors:**
    -   400: No updatable fields submitted or address already exists
    -   404: Wallet not found or not owned by user

---

#### DELETE `/api/wallets/:id`

Delete a wallet owned by the user.

-   **Headers:**  
     `Authorization: Bearer <jwt_token_here>`
-   **Response:**
    ```json
    { "message": "Wallet deleted" }
    ```
-   **Errors:**
    -   404: Wallet not found or not owned by user

---

## Error Handling & Validation

-   All endpoints validate input and return appropriate status codes:
    -   200: Success
    -   201: Created
    -   400: Bad request (input error)
    -   401: Unauthorized
    -   404: Not found
    -   500: Internal server error
-   Error responses are structured:
    ```json
    { "error": "Description of error" }
    ```
-   Examples of validation:
    -   `email` must be valid format
    -   Required fields must be present
    -   Wallet addresses must be unique per user

---

## Notes

-   Passwords are hashed securely.
-   JWT is used for stateless authentication.
-   Each user can only manipulate their own wallets.

---

## Postman Collection

A ready-to-use [Postman collection](./wallet-api.postman_collection.json) is included for testing the API.

### How to use:

1. Open [Postman](https://www.postman.com/downloads/).
2. Click `Import` at the top left.
3. Select `wallet-api.postman_collection.json` from this repository.
4. Use the preconfigured endpoints. Set your JWT token (from `/signin`) in the **Authorization** header as needed.
