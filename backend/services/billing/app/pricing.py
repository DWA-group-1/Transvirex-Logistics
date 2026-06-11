"""
Simple, auditable pricing table for MVP.

Formula:
    amount = base_per_parcel * parcel_count
           + service_type_multiplier * base_per_parcel * parcel_count
           + priority_surcharge
           + weight_tier_charge(weight_kg)

All values in EUR (or whatever base currency the company uses).
"""
from decimal import Decimal

# ── Per-parcel base ────────────────────────────────────────────────────────────
BASE_PER_PARCEL = Decimal("5.00")

# ── Service type multipliers (applied on top of base) ─────────────────────────
SERVICE_MULTIPLIERS: dict[str, Decimal] = {
    "standard":  Decimal("1.0"),
    "express":   Decimal("1.8"),
    "overnight": Decimal("2.5"),
    "economy":   Decimal("0.7"),
}
DEFAULT_SERVICE_MULTIPLIER = Decimal("1.0")

# ── Priority surcharges (flat fee per delivery) ────────────────────────────────
PRIORITY_SURCHARGES: dict[str, Decimal] = {
    "low":    Decimal("0.00"),
    "normal": Decimal("0.00"),
    "high":   Decimal("8.00"),
    "urgent": Decimal("20.00"),
}
DEFAULT_PRIORITY_SURCHARGE = Decimal("0.00")

# ── Weight tiers (charge per kg above threshold) ───────────────────────────────
# Format: (max_kg_exclusive, charge_per_kg)
# The last entry acts as the catch-all tier.
WEIGHT_TIERS: list[tuple[Decimal, Decimal]] = [
    (Decimal("5"),   Decimal("0.00")),   # 0–5 kg: free
    (Decimal("20"),  Decimal("0.50")),   # 5–20 kg: €0.50/kg
    (Decimal("50"),  Decimal("0.80")),   # 20–50 kg: €0.80/kg
    (Decimal("999"), Decimal("1.20")),   # 50+ kg: €1.20/kg
]

FLAT_RATE_FALLBACK = Decimal("15.00")


def price_delivery(
    *,
    service_type: str | None,
    priority: str | None,
    weight_kg: Decimal | None,
    parcel_count: int | None,
) -> Decimal:
    """
    Return the billable amount for a single delivery.

    Falls back to FLAT_RATE_FALLBACK when all pricing attributes are missing
    (e.g. legacy deliveries created before the payload was extended).
    """
    if parcel_count is None and weight_kg is None and service_type is None:
        return FLAT_RATE_FALLBACK

    parcels = max(parcel_count or 1, 1)
    svc_key = (service_type or "standard").lower()
    pri_key = (priority or "normal").lower()
    kg = weight_kg or Decimal("0")

    multiplier = SERVICE_MULTIPLIERS.get(svc_key, DEFAULT_SERVICE_MULTIPLIER)
    surcharge = PRIORITY_SURCHARGES.get(pri_key, DEFAULT_PRIORITY_SURCHARGE)

    base = BASE_PER_PARCEL * parcels * multiplier

    weight_charge = Decimal("0")
    for max_kg, rate in WEIGHT_TIERS:
        if kg <= max_kg:
            weight_charge = kg * rate
            break

    return (base + surcharge + weight_charge).quantize(Decimal("0.01"))
