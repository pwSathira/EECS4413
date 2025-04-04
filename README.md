# BidWise Auction System

A modern auction platform built with FastAPI and Next.js.

## Quick Start

To run the application using Docker:

1. Clone this repository
2. Navigate to the docker directory:
   ```bash
   cd docker
   ```
3. Build and start the containers:
   ```bash
   docker compose up --build
   ```
4. To start application, run initdb route via backend api i.e. http://localhost:8000/docs
5. To run a sample setup of the project run /api/v1/auctions/create-sample via backend api
   - This will create sample users and auctions
   - s1@test.com password: 123 role: seller
   - s2@test.com password: 123 role: seller
   - b1@test.com password: 123
   - b2@test.com password 123
The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Features

- Real-time auction bidding
- User authentication and authorization
- Email notifications for auction events
- Secure payment processing
- Responsive web interface


