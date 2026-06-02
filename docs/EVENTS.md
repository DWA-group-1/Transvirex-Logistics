# Event bus contract

Services communicate state changes asynchronously through **Redis Streams**. This
document is the contract: which streams exist, what events flow through them, and
the shape of each payload. It is the reference any service should read before
producing or consuming events.

## Transport

- **Backbone:** Redis Streams (durable, append-only logs).
- **One stream per producer**, named `<producer>.events` (e.g. `catalog.events`).
- **Consumers** register as Redis **consumer groups** on the streams they care
  about. Within a group each event is delivered to exactly one consumer; across
  groups, every group sees every event.
- **Delivery semantics:** at-least-once. A consumer acknowledges (`XACK`) an event
  only after all its handlers succeed. If a handler raises, the event is left
  unacknowledged in the Pending Entries List for later recovery (no automated
  reclaim is currently implemented).
- **Durability:** because streams persist, a consumer that is offline when an
  event is published catches up on reconnection from its last acknowledged
  position.

## Enveloppe

Every event is published as a single Redis stream field whose value is a JSON
enveloppe. The producing code (`EventBus.publish`) wraps the domain payload like
this:

```json
{
  "event_id": "uuid4 string",
  "event_type": "driver.created",
  "occurred_at": "ISO 8601 UTC timestamp",
  "producer": "catalog",
  "event_version": 1,
  "data": {}
}
```

| Field           | Type              | Meaning                                                         |
| --------------- | ----------------- | --------------------------------------------------------------- |
| `event_id`      | string (UUID4)    | Unique id for this event instance.                              |
| `event_type`    | string            | Dotted type, e.g. `driver.created`. Consumers dispatch on this. |
| `occurred_at`   | string (ISO 8601) | When the event occurred, UTC.                                   |
| `producer`      | string            | Name of the producing service.                                  |
| `event_version` | integer           | Enveloppe/schema version. Currently `1`.                        |
| `data`          | object            | Domain-specific payload (see each event below).                 |

> **Spelling note:** in the current implementation the Redis field key is
> `enveloppe` and the timestamp key is `occurred_at` (both misspelled). Producer
> and consumer use the same spelling, so nothing is broken, but consider
> normalising to `enveloppe` / `occurred_at` in a future cleanup. If you do, change
> it in every service's `events.py` at once.

Consumers receive the parsed enveloppe (a `dict`) and read `enveloppe["data"]` for
the payload, dispatching on `enveloppe["event_type"]`.

---

## Streams and events

### `catalog.events`

Produced by the **Catalog** service. Currently **published but not yet consumed**
— no service registers a handler for these. They are emitted now so future
subscribers (Notification, Reporting) can consume them without changes to Catalog.

#### `driver.created`

Emitted after a driver and its linked Auth user are successfully created.

```json
{
  "driver_id": "uuid",
  "auth_user_id": "uuid",
  "email": "driver@example.com",
  "full_name": "Marie Dupont"
}
```

#### `driver.updated`

Emitted when a driver's mutable fields change. `changes` contains only the fields
that were modified.

```json
{
  "driver_id": "uuid",
  "changes": { "phone": "+33 6 00 00 00 00" }
}
```

#### `driver.deactivated`

Emitted when a driver is soft-deleted (`is_active` set to `false`). The row is
retained.

```json
{
  "driver_id": "uuid"
}
```

#### `hub.created`

Emitted after a hub is created.

```json
{
  "hub_id": "uuid",
  "code": "PAR-01",
  "name": "Paris Nord Depot"
}
```

#### `hub.updated`

Emitted when a hub's fields change. `changes` contains only the modified fields.

```json
{
  "hub_id": "uuid",
  "changes": { "capacity": 750 }
}
```

#### `hub.deactivated`

Emitted when a hub is soft-deleted (`is_active` set to `false`).

```json
{
  "hub_id": "uuid"
}
```

### `delivery.events`

Produced by the **Delivery** service. The Notification service subscribes to this
stream (see Consumers). `delivery.completed` is the event Billing will subscribe to
once built.

#### `delivery.created`

Emitted when a delivery is created.

```json
{
  "delivery_id": "uuid",
  "customer_id": "uuid",
  "hub_id": "uuid"
}
```

#### `delivery.assigned`

Emitted when a driver is assigned (at creation or via the assign endpoint, including
reassignment).

```json
{
  "delivery_id": "uuid",
  "driver_id": "uuid"
}
```

#### `delivery.picked_up`

Emitted when the delivery moves ASSIGNED → PICKED_UP.

```json
{
  "delivery_id": "uuid",
  "driver_id": "uuid | null"
}
```

#### `delivery.in_transit`

Emitted when the delivery moves PICKED_UP → IN_TRANSIT.

```json
{
  "delivery_id": "uuid",
  "driver_id": "uuid | null"
}
```

#### `delivery.completed`

Emitted when the delivery moves IN_TRANSIT → DELIVERED. **Billing subscribes to this**
to generate invoices.

```json
{
  "delivery_id": "uuid",
  "driver_id": "uuid | null"
}
```

#### `delivery.cancelled`

Emitted when a delivery is cancelled from any non-terminal state.

```json
{
  "delivery_id": "uuid"
}
```

---

## Consumers

### Notification

Subscribes to `delivery.events`, `catalog.events`, and `billing.events` (via a
single dispatcher registered on each stream). It currently has handlers for:

| Event type          | Reaction                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `delivery.assigned` | Persists a notification and pushes a "new mission" alert to the assigned driver over WebSocket. |
| `incident.declared` | Persists a notification and broadcasts an incident alert to dispatchers.                        |

Any event type without a registered handler is acknowledged and ignored (logged
at info level).

> **Status:** the two handled event types (`delivery.assigned`,
> `incident.declared`) come from the **Delivery** service, which is not yet built.
> Until Delivery exists, Notification subscribes but receives nothing. The Catalog
> events above are published but have no Notification handler yet.

---

## Planned events

These are part of the target architecture and will be added as their producing
services are built. Listed here so the contract is forward-looking.

| Stream           | Event type         | Producer | Notes                                             |
| ---------------- | ------------------ | -------- | ------------------------------------------------- |
| `billing.events` | `invoice.created`  | Billing  | An invoice is generated for a completed delivery. |
| `billing.events` | `payment.received` | Billing  | A payment is recorded.                            |

## Adding a new event

1. Publish it from the producing service:
   `await bus.publish("<producer>.events", "<entity>.<action>", { ... })`.
2. Keep the `data` payload self-contained enough that common subscribers don't
   need to call back to the producer for basic details.
3. Document the new event type and its payload in this file.
4. If a consumer needs to react, register a handler on the relevant stream in
   that consumer's handler module.
