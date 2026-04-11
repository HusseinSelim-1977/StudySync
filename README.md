# StudySync

Real-Time Study Buddy Matcher

## Architecture

```text
                 +-----------------+
                 |  index.html     | (Vanilla JS + Subscriptions)
                 +--------+--------+
                          |
                          v
                 +--------+--------+
                 | Apollo Gateway  | (Port 4000, GraphQL)
                 +--------+--------+
                          |
    +---------------------|-----------------------+
    |         +-----------+----------+            |
    |         |                      |            |
    v         v                      v            v
+------+  +-------+  +------------+ +--------+ +-------+ +-------+ +---------+
|User  |  |Profile|  |Availability| |Matching| |Session| |Notifs | |Messaging|
|Svc   |  |Svc    |  |Svc         | |Svc     | |Svc    | |Svc    | |Svc      |
|4001  |  |4002   |  |4003        | |4004    | |4005   | |4006   | |4007     |
+--+---+  +---+---+  +-----+------+ +----+---+ +---+---+ +---+---+ +----+----+
   |          |            |             |         |         |          |
   v          v            v             v         v         v          v
 (Neon)     (Neon)       (Neon)        (Neon)    (Neon)    (Neon)     (Neon)
   |          |            |             |         |         |          |
   +----------+------------+------+------+---------+---------+----------+
                                  |
                                  v
                            +-----------+
                            | Kafka JS  |
                            | Broker    |
                            +-----------+
```

## Setup Instructions

1. **Environment Setup:** 
   Copy `.env.example` to `.env`. For each service, you will need a separate PostgreSQL database instance (Neon DB works best). Replace the placeholder connection strings (e.g. `USER_DB_URL`, `PROFILE_DB_URL`) with your actual URIs. Provide a unique, random string for `JWT_SECRET`. Keep this file secure and never commit it to git.
2. **Prisma & Dependencies:** Ensure you have Node.js and Docker installed.
   Go to each service nested inside `services/` and run `npm install` followed by `npx prisma db push` to initialize schema tables.
3. **Run Services:** 
   Run `docker-compose up -d --build`. This will spin up Kafka, Zookeeper, Kafka UI, your 7 microservices, and the Apollo GraphQL Gateway natively at `http://localhost:4000/graphql`.
4. **Use Output:** 
   Open `frontend/index.html` via VSCode Live Server (or similar) to interact directly with the locally deployed microservices!
