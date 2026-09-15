# RentBase

## Project Description

### System Purpose

RentBase is a web platform for managing residential buildings, their apartments, and tenant bookings/leases. Administrators can register buildings and apartments, members can book or lease available apartments, and guests can browse listings before registering.

### Functional Requirements

- User registration and login (JWT-based authentication)
- Guests can browse buildings and view available apartments
- Members can create, view, and cancel their own bookings/leases
- Members can view their booking history
- Administrators can create, edit, and delete buildings and apartments
- Administrators can manage all bookings and user roles
- Role-based access control (guest / member / administrator)
- Hierarchical listing endpoints (e.g. all apartments of a given building, all bookings for a given apartment)

### Domain Model

Building → Apartment → Booking

- **Building** - a residential building (address, number of floors, etc.)
- **Apartment** - belongs to a Building (floor, room count, area, rent price)
- **Booking** - belongs to an Apartment (tenant, dates, status)

### Deployment Diagram

Three-tier architecture:

- **Client** - frontend SPA running in the browser
- **API** - REST backend, containerized, deployed on a cloud VM/PaaS
- **Database** - managed cloud database instance

Communication is over HTTPS; JWT tokens are sent in the Authorization header. A full diagram will be added as the implementation progresses.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core Web API (C#) |
| Database | PostgreSQL (via Entity Framework Core) |
| Authentication | JWT with refresh token strategy |
| Frontend | React |
| API Documentation | Swagger / OpenAPI |
| Deployment | Docker container on a cloud platform (Render / Railway / Azure App Service) |
