"""
Seed the running system with the workbook dataset, through the gateway,
in dependency order: hubs + customers -> drivers -> deliveries
-> transitions/incidents.

References (CUST-2026-xxx, DEL-2026-xxxx, ...) are generated server-side, so
they will NOT match the workbook's exact codes — that's expected and fine.
The script maps the workbook codes to the generated UUIDs to wire relations.

Run after:  make up && make migrate && make seed-admin
Usage:      python seed_workbook.py
Env:        GATEWAY_URL (default http://localhost:8000)
            ADMIN_EMAIL / ADMIN_PASSWORD (default admin@transvirex.local / changeme)
            DRIVER_PASSWORD (default ChangeMe123!)

Idempotency: NOT idempotent. Run once on a fresh DB (after nuke+migrate+seed-admin).
Re-running creates duplicates / 409s on driver emails.
"""

import os
import sys
import httpx

GATEWAY = os.getenv("GATEWAY_URL", "http://localhost:8000")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@transvirex.local")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme")
DRIVER_PASSWORD = os.getenv("DRIVER_PASSWORD", "ChangeMe123!")

# ─── Workbook data ────────────────────────────────────────────────────────────
HUBS = [
    # code, name, address, city, zip, capacity
    ("HUB001", "Paris North Hub", "12 Rue Logistique Nord", "Paris", "75018", 5000),
    ("HUB002", "Paris South Hub", "45 South Avenue", "Évry", "91000", 3500),
    ("HUB003", "Lyon Hub", "78 Boulevard Logistique", "Lyon", "69007", 4000),
    ("HUB004", "Marseille Hub", "23 Industrial Zone Port", "Marseille", "13015", 3000),
    ("HUB005", "Toulouse Hub", "56 Chemin Aérospatial", "Toulouse", "31500", 2500),
    ("HUB006", "Bordeaux Hub", "89 Logistics Quay", "Bordeaux", "33300", 2000),
    ("HUB007", "Lille Hub", "34 Transport Street", "Lille", "59100", 2800),
]

CUSTOMERS = [
    # code, name, contact, email, address, city, zip
    (
        "CUST001",
        "EcomExpress SAS",
        "John Smith",
        "contact@ecomexpress.fr",
        "15 Commerce Street",
        "Paris",
        "75001",
    ),
    (
        "CUST002",
        "FreshFood Distribution",
        "Marie Blanc",
        "m.blanc@freshfood.fr",
        "42 Avenue des Halles",
        "Lyon",
        "69001",
    ),
    (
        "CUST003",
        "TechParts Solutions",
        "Pierre Martin",
        "p.martin@techparts.com",
        "8 Boulevard Industriel",
        "Toulouse",
        "31000",
    ),
    (
        "CUST004",
        "MediSupply France",
        "Sophie Bernard",
        "s.bernard@medisupply.fr",
        "23 Rue de la Santé",
        "Marseille",
        "13001",
    ),
    (
        "CUST005",
        "FashionHub Online",
        "Luc Petit",
        "contact@fashionhub.fr",
        "67 Fashion Street",
        "Paris",
        "75008",
    ),
    (
        "CUST006",
        "AutoPièces Direct",
        "Claire Roux",
        "c.roux@autopieces.fr",
        "91 Industrial Zone",
        "Bordeaux",
        "33000",
    ),
    (
        "CUST007",
        "BioFarm Logistics",
        "Thomas Moreau",
        "t.moreau@biofarm.fr",
        "5 Chemin Rural",
        "Lille",
        "59000",
    ),
    (
        "CUST008",
        "UrbanMarket",
        "Julie Simon",
        "j.simon@urbanmarket.fr",
        "33 Market Square",
        "Lyon",
        "69002",
    ),
    (
        "CUST009",
        "ProOffice Supplies",
        "Marc Laurent",
        "m.laurent@prooffice.fr",
        "18 Professional Street",
        "Paris",
        "75015",
    ),
    (
        "CUST010",
        "PharmaCare Express",
        "Emma Girard",
        "e.girard@pharmacare.fr",
        "7 Medical Avenue",
        "Toulouse",
        "31200",
    ),
]

DRIVERS = [
    # code, first, last, phone, email, hub_code
    (
        "DRV001",
        "Marc",
        "Dubois",
        "+33 6 01 23 45 67",
        "m.dubois@transvirex.com",
        "HUB001",
    ),
    (
        "DRV002",
        "Sophie",
        "Martin",
        "+33 6 01 23 45 68",
        "s.martin@transvirex.com",
        "HUB001",
    ),
    (
        "DRV003",
        "Pierre",
        "Leroy",
        "+33 6 01 23 45 69",
        "p.leroy@transvirex.com",
        "HUB003",
    ),
    (
        "DRV004",
        "Julie",
        "Bernard",
        "+33 6 01 23 45 70",
        "j.bernard@transvirex.com",
        "HUB004",
    ),
    (
        "DRV005",
        "Thomas",
        "Petit",
        "+33 6 01 23 45 71",
        "t.petit@transvirex.com",
        "HUB002",
    ),
    ("DRV006", "Marie", "Roux", "+33 6 01 23 45 72", "m.roux@transvirex.com", "HUB003"),
    (
        "DRV007",
        "Alexandre",
        "Moreau",
        "+33 6 01 23 45 73",
        "a.moreau@transvirex.com",
        "HUB006",
    ),
    (
        "DRV008",
        "Camille",
        "Simon",
        "+33 6 01 23 45 74",
        "c.simon@transvirex.com",
        "HUB001",
    ),
    (
        "DRV009",
        "Lucas",
        "Laurent",
        "+33 6 01 23 45 75",
        "l.laurent@transvirex.com",
        "HUB007",
    ),
    (
        "DRV010",
        "Emma",
        "Girard",
        "+33 6 01 23 45 76",
        "e.girard@transvirex.com",
        "HUB005",
    ),
    (
        "DRV011",
        "Nicolas",
        "Lefebvre",
        "+33 6 01 23 45 77",
        "n.lefebvre@transvirex.com",
        "HUB001",
    ),
    (
        "DRV012",
        "Léa",
        "Garcia",
        "+33 6 01 23 45 78",
        "l.garcia@transvirex.com",
        "HUB004",
    ),
]

# Map workbook service/priority oddities to your form's vocabulary.
SERVICE_MAP = {"Switchboard": "Standard", "Express": "Express", "Freight": "Freight"}
PRIORITY_MAP = {"Urgent": "High", "High": "High", "Normal": "Normal", "Low": "Low"}
# Workbook status -> how far to drive the state machine
STATUS_MAP = {
    "Scheduled": "assigned",  # assigned, no movement
    "In progress": "in_transit",  # pickup + depart
    "Delivered": "delivered",  # full chain
    "Cancelled": "cancelled",
}

DELIVERIES = [
    # del_code, cust, hub, pickup, dest, city, zip, parcels, weight, service, status, priority, expected, driver, notes
    (
        "DEL-2026-0001",
        "CUST001",
        "HUB001",
        "15 Rue du Commerce",
        "89 Client Street",
        "Paris",
        "75011",
        3,
        12.5,
        "Express",
        "Delivered",
        "High",
        "2026-02-10",
        "DRV001",
        "Customer absent - delivered to neighbor",
    ),
    (
        "DEL-2026-0002",
        "CUST002",
        "HUB003",
        "42 Avenue des Halles",
        "156 Boulevard Recipient",
        "Lyon",
        "69003",
        5,
        25.8,
        "Switchboard",
        "Delivered",
        "Normal",
        "2026-02-11",
        "DRV003",
        "RAS",
    ),
    (
        "DEL-2026-0003",
        "CUST005",
        "HUB001",
        "67 Rue de la Mode",
        "234 Rue Livraison",
        "Paris",
        "75017",
        2,
        8.3,
        "Express",
        "In progress",
        "Urgent",
        "2026-02-15",
        "DRV002",
        "Delivery in progress",
    ),
    (
        "DEL-2026-0004",
        "CUST003",
        "HUB005",
        "8 Boulevard Industriel",
        "45 Avenue Client",
        "Toulouse",
        "31100",
        8,
        45.2,
        "Freight",
        "In progress",
        "Normal",
        "2026-02-16",
        "DRV010",
        "Requires forklift",
    ),
    (
        "DEL-2026-0005",
        "CUST004",
        "HUB004",
        "23 Rue de la Santé",
        "78 Hospital Road",
        "Marseille",
        "13008",
        1,
        3.2,
        "Express",
        "Delivered",
        "Urgent",
        "2026-02-13",
        "DRV004",
        "Urgent medical delivery",
    ),
    (
        "DEL-2026-0006",
        "CUST001",
        "HUB001",
        "15 Rue du Commerce",
        "123 Destinataire Street",
        "Boulogne",
        "92100",
        4,
        15.7,
        "Switchboard",
        "Scheduled",
        "Normal",
        "2026-02-17",
        "DRV001",
        "",
    ),
    (
        "DEL-2026-0007",
        "CUST006",
        "HUB006",
        "91 Bordeaux Industrial Zone",
        "67 Garage Street",
        "Bordeaux",
        "33200",
        6,
        32.4,
        "Switchboard",
        "In progress",
        "Normal",
        "2026-02-16",
        "DRV007",
        "Fragile automotive parts",
    ),
    (
        "DEL-2026-0008",
        "CUST008",
        "HUB003",
        "33 Place du Marché",
        "89 Commerce Avenue",
        "Lyon",
        "69005",
        3,
        11.5,
        "Express",
        "Delivered",
        "High",
        "2026-02-14",
        "DRV006",
        "RAS",
    ),
    (
        "DEL-2026-0009",
        "CUST007",
        "HUB007",
        "5 Chemin Rural",
        "234 Organic Farm",
        "Lille",
        "59200",
        10,
        52.3,
        "Freight",
        "In progress",
        "Normal",
        "2026-02-17",
        "DRV009",
        "Agricultural products - gentle handling",
    ),
    (
        "DEL-2026-0010",
        "CUST009",
        "HUB002",
        "18 Professional Street",
        "456 Customer Office",
        "Paris",
        "75013",
        2,
        6.8,
        "Switchboard",
        "Scheduled",
        "Normal",
        "2026-02-18",
        "DRV005",
        "",
    ),
    (
        "DEL-2026-0011",
        "CUST010",
        "HUB005",
        "7 Medical Avenue",
        "90 Pharmacy Street",
        "Toulouse",
        "31300",
        1,
        2.1,
        "Express",
        "Delivered",
        "Urgent",
        "2026-02-13",
        "DRV010",
        "Pharmaceutical products",
    ),
    (
        "DEL-2026-0012",
        "CUST001",
        "HUB001",
        "15 Rue du Commerce",
        "678 Residential Avenue",
        "Paris",
        "75019",
        5,
        18.9,
        "Express",
        "In progress",
        "High",
        "2026-02-16",
        "DRV008",
        "",
    ),
    (
        "DEL-2026-0013",
        "CUST002",
        "HUB003",
        "42 Avenue des Halles",
        "12 Center Square",
        "Lyon",
        "69001",
        7,
        28.6,
        "Switchboard",
        "Scheduled",
        "Normal",
        "2026-02-18",
        "DRV003",
        "",
    ),
    (
        "DEL-2026-0014",
        "CUST005",
        "HUB001",
        "67 Rue de la Mode",
        "345 Boulevard Mode",
        "Paris",
        "75009",
        3,
        9.4,
        "Express",
        "Cancelled",
        "Normal",
        "2026-02-12",
        "DRV011",
        "Customer canceled the order",
    ),
    (
        "DEL-2026-0015",
        "CUST004",
        "HUB004",
        "23 Rue de la Santé",
        "567 Chemin Clinique",
        "Marseille",
        "13010",
        2,
        4.7,
        "Express",
        "Delivered",
        "High",
        "2026-02-15",
        "DRV012",
        "RAS",
    ),
]

# del_code, type, description, severity(low|medium|high), resolve?(resolution or None)
INCIDENTS = [
    (
        "DEL-2026-0001",
        "Delivery delay",
        "Traffic jam on the ring road",
        "low",
        "Delivery made 30 minutes late",
    ),
    (
        "DEL-2026-0004",
        "Damaged package",
        "Box damaged during transport",
        "medium",
        None,
    ),
    (
        "DEL-2026-0007",
        "Incorrect address",
        "Error in customer system",
        "medium",
        "Customer contacted - new address provided",
    ),
    (
        "DEL-2026-0009",
        "Vehicle breakdown",
        "Engine problem - urgent maintenance",
        "high",
        None,
    ),
]


def main() -> None:
    client = httpx.Client(base_url=GATEWAY, timeout=30)

    # ── 1. Login as admin ──────────────────────────────────────────────────
    r = client.post(
        "/auth/token", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if r.status_code != 200:
        sys.exit(
            f"Login failed ({r.status_code}): {r.text}\nDid you run seed-admin? Is ADMIN_PASSWORD right?"
        )
    token = r.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    print(f"✓ authenticated as {ADMIN_EMAIL}")

    def post(path, json, label):
        resp = client.post(path, json=json, headers=h)
        if resp.status_code >= 300:
            sys.exit(
                f"✗ {label} failed ({resp.status_code}): {resp.text}\n  payload={json}"
            )
        return resp.json()

    # ── 2. Hubs ────────────────────────────────────────────────────────────
    hub_id = {}
    for code, name, address, city, zipc, cap in HUBS:
        out = post(
            "/catalog/hubs",
            {
                "name": name,
                "address": address,
                "city": city,
                "zip_code": zipc,
                "capacity": cap,
            },
            f"hub {code}",
        )
        hub_id[code] = out["id"]
    print(f"✓ {len(hub_id)} hubs")

    # ── 3. Customers ───────────────────────────────────────────────────────
    cust_id = {}
    for code, name, contact, email, address, city, zipc in CUSTOMERS:
        out = post(
            "/catalog/customers",
            {
                "name": name,
                "contact_name": contact,
                "email": email,
                "address": address,
                "city": city,
                "zip_code": zipc,
            },
            f"customer {code}",
        )
        cust_id[code] = out["id"]
    print(f"✓ {len(cust_id)} customers")

    # ── 4. Drivers (creates auth account + driver via the saga) ─────────────
    driver_id = {}
    for code, first, last, phone, email, hub_code in DRIVERS:
        out = post(
            "/catalog/drivers",
            {
                "email": email,
                "password": DRIVER_PASSWORD,
                "first_name": first,
                "last_name": last,
                "phone": phone,
                "hub_id": hub_id[hub_code],
            },
            f"driver {code}",
        )
        driver_id[code] = out["id"]
    print(f"✓ {len(driver_id)} drivers (password: {DRIVER_PASSWORD})")

    # ── 5. Deliveries + drive the state machine to match the workbook ───────
    n = 0
    for (
        dc,
        cust,
        hub,
        pickup,
        dest,
        city,
        zipc,
        parcels,
        weight,
        service,
        wstatus,
        wpriority,
        expected,
        drv,
        notes,
    ) in DELIVERIES:
        target = STATUS_MAP[wstatus]
        body = {
            "hub_id": hub_id[hub],
            "customer_id": cust_id[cust],
            "pickup_address": pickup,
            "delivery_address": dest,
            "city": city,
            "zip_code": zipc,
            "parcel_count": parcels,
            "weight_kg": weight,
            "service_type": SERVICE_MAP.get(service, service),
            "priority": PRIORITY_MAP.get(wpriority, wpriority),
            "expected_date": f"{expected}T00:00:00",
            "notes": notes or None,
        }
        # Create assigned-at-creation (passes assigned_driver_id query param).
        did_resp = client.post(
            "/delivery/deliveries",
            params={"assigned_driver_id": driver_id[drv]},
            json=body,
            headers=h,
        )
        if did_resp.status_code >= 300:
            sys.exit(
                f"✗ delivery {dc} failed ({did_resp.status_code}): {did_resp.text}"
            )
        did = did_resp.json()["id"]

        # Advance the state machine to the workbook status.
        chain = {
            "assigned": [],
            "in_transit": ["pickup", "depart"],
            "delivered": ["pickup", "depart", "deliver"],
            "cancelled": ["cancel"],
        }[target]
        for action in chain:
            resp = client.post(f"/delivery/deliveries/{did}/{action}", headers=h)
            if resp.status_code >= 300:
                sys.exit(f"✗ {dc} {action} failed ({resp.status_code}): {resp.text}")
        n += 1
    # remember delivery uuids by workbook code for incidents
    # (re-fetch the full list once, map by reference order is fragile — instead
    #  track during creation)
    print(f"✓ {n} deliveries (driven to their workbook status)")

    # We need delivery UUIDs for incidents; recreate the map from the loop above.
    # Simplest: refetch all deliveries and map by delivery_address (unique here).
    all_del = client.get(
        "/delivery/deliveries", params={"limit": 100}, headers=h
    ).json()["items"]
    by_addr = {d["delivery_address"]: d["id"] for d in all_del}

    # ── 6. Incidents (declare, optionally resolve) ──────────────────────────
    dest_of = {d[0]: d[4] for d in DELIVERIES}  # del_code -> delivery_address
    ic = 0
    for del_code, itype, desc, severity, resolution in INCIDENTS:
        did = by_addr.get(dest_of[del_code])
        if not did:
            print(f"  ! skip incident for {del_code} (delivery not found)")
            continue
        inc = client.post(
            f"/delivery/deliveries/{did}/incidents",
            json={"type": itype, "description": desc, "severity": severity},
            headers=h,
        )
        if inc.status_code >= 300:
            print(f"  ! incident {del_code} failed ({inc.status_code}): {inc.text}")
            continue
        incident_id = inc.json()["id"]
        if resolution:
            client.post(
                f"/delivery/deliveries/incidents/{incident_id}/resolve",
                json={"resolution": resolution},
                headers=h,
            )
        ic += 1
    print(f"✓ {ic} incidents")

    print(
        "\n✅ seed complete. KPI history is separate — run `make seed-kpi` for the dashboard trend."
    )


if __name__ == "__main__":
    main()
