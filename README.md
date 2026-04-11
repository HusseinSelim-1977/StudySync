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

1. Copy `.env.example` to `.env` and fill out your Neon DB URIs. Keep secrets safe!
2. Ensure you have Docker and NodeJS latest LTS ready.
3. Run `npm install` inside all service folders, generating Prisma engines with `npx prisma db push`.
4. Run `docker-compose up -d --build` to launch Zookeeper, Kafka, KafkaUI, the 7 Microservices, and the Apollo GraphQL Gateway.
5. In your target file explore `frontend/index.html` via any web server plugin logic mappings.
