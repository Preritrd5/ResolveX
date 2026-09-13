"""
ResolveX — Deterministic Synthetic Demo Data Generator
Enterprise: Acme Commerce Inc.
Target: 500+ customers, 300+ tickets, 700+ messages, 500+ orders, 500+ payments, 7 policies, 21+ knowledge chunks, 5 demo cases.
Fixed Random Seed: 42
"""

import json
import random
import uuid
from datetime import datetime, timedelta, timezone

SEED = 42
rng = random.Random(SEED)

def deterministic_uuid(namespace: str, index: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{namespace}-{index}-{SEED}"))

# Fixed Base IDs
ORG_ID = "00000000-0000-0000-0000-000000000001" # Acme Commerce Org ID
ADMIN_USER_ID = "00000000-0000-0000-0000-000000000010"
AGENT_USER_1_ID = "00000000-0000-0000-0000-000000000011" # Support Agent Alex Rivera
AGENT_USER_2_ID = "00000000-0000-0000-0000-000000000012" # Support Agent Jordan Lee
LEAD_INVESTIGATOR_ID = "00000000-0000-0000-0000-000000000013" # Lead Investigator Maya Patel

BASE_TIME = datetime(2026, 9, 13, 14, 0, 0, tzinfo=timezone.utc)

FIRST_NAMES = [
    "Marcus", "Sarah", "Elena", "David", "Priya", "James", "Emily", "Liam", "Olivia", "Noah",
    "Sophia", "Lucas", "Mia", "Ethan", "Harper", "Aiden", "Evelyn", "Jackson", "Abigail", "Mason",
    "Amelia", "Logan", "Ella", "Alexander", "Avery", "Henry", "Scarlett", "Sebastian", "Grace", "Jack"
]
LAST_NAMES = [
    "Vance", "Chen", "Gomez", "Kim", "Patel", "Smith", "Johnson", "Williams", "Brown", "Jones",
    "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris"
]

PRODUCT_TEMPLATES = [
    ("AeroTune Wireless Noise-Cancelling Headphones", "Audio", 19999),
    ("PulseSound Portable Bluetooth Speaker", "Audio", 7999),
    ("OmniCharge 3-in-1 Fast Wireless Charging Station", "Power & Charging", 4999),
    ("Titanium MagSafe Power Bank 10000mAh", "Power & Charging", 3999),
    ("NovaGlow Smart Ambient RGB Light Bar", "Smart Home", 5999),
    ("AuraWatch Active Smart Fitness Tracker", "Wearables", 12999),
    ("Veloce Mechanical Ergonomic Keyboard", "Computing", 14999),
    ("PrecisionGlide Wireless Optical Mouse", "Computing", 4999),
    ("ApexShield Shockproof Laptop Sleeve 14-inch", "Accessories", 2999),
    ("HydroFlow Insulated Smart Water Bottle", "Accessories", 3499),
    ("EchoView 2K Ultra HD Smart Video Doorbell", "Smart Home", 8999),
    ("AirPure HEPA Smart Air Purifier Mini", "Smart Home", 11999)
]

NORMAL_CONVERSATION_SETS = [
    (
        "How do I update my shipping address?",
        "Hi, I placed an order yesterday and realized my apartment number is missing. Can you update my shipping address before it dispatches?",
        "Hello! I can definitely help you update the address. Could you provide the correct apartment number?",
        "Thanks! It is Apartment 4B, Building 2. Please make sure the courier has this.",
        "Address updated successfully! I have notified fulfillment center FC-BLR-01. You will receive an updated dispatch notification shortly."
    ),
    (
        "Question about headphone warranty coverage",
        "Does the 1-year warranty cover accidental cable damage or just electronic failure?",
        "Our 1-year limited warranty covers all internal manufacturing defects and battery degradation. Accidental damage can be covered with our AcmeCare+ addon.",
        "Understood! Can I still add AcmeCare+ if I bought the headphones 2 weeks ago?",
        "Yes, you have up to 30 days from purchase to add AcmeCare+. You can activate it directly from your customer account page."
    ),
    (
        "International shipping inquiry to Canada",
        "Do you charge duties upfront for orders shipped to Toronto, or are they collected at delivery?",
        "All customs duties and taxes are calculated and collected directly at checkout for Canadian orders, with zero surprise fees on delivery.",
        "Great, thanks! What is the estimated delivery time for express shipping?",
        "Express international shipping typically arrives within 3 to 5 business days via DHL Express."
    ),
    (
        "Can I change my order color?",
        "I ordered the Midnight Black speaker but would prefer the Alpine White version if it hasn't shipped yet.",
        "Let me check the warehouse queue. Looks like it has not been packed yet, so I have switched it to Alpine White!",
        "Awesome, really appreciate the quick response and swap!",
        "You're very welcome! Have a wonderful day."
    ),
    (
        "Compatibility with MacBook Pro M3",
        "Will the OmniCharge dock support fast charging with the 2024 MacBook Pro M3?",
        "Yes, the USB-C PD port supports up to 65W charging which is fully compatible with the 14-inch M3.",
        "Does it require a special cable included in the box?",
        "A certified 100W braided USB-C cable is included right in the box for optimal power delivery."
    )
]

def generate_all_data():
    data = {}
    
    # 1. Organization
    data["organizations"] = [{
        "id": ORG_ID,
        "name": "Acme Commerce Inc.",
        "slug": "acme-commerce",
        "tier": "enterprise",
        "settings": {
            "currency": "USD",
            "support_email": "support@acmecommerce.com",
            "timezone": "UTC"
        }
    }]
    
    # 2. Users
    data["users"] = [
        {
            "id": ADMIN_USER_ID,
            "org_id": ORG_ID,
            "email": "admin@acmecommerce.com",
            "full_name": "Devin Wright",
            "role": "admin",
            "is_active": True
        },
        {
            "id": AGENT_USER_1_ID,
            "org_id": ORG_ID,
            "email": "alex.rivera@acmecommerce.com",
            "full_name": "Alex Rivera",
            "role": "support_agent",
            "is_active": True
        },
        {
            "id": AGENT_USER_2_ID,
            "org_id": ORG_ID,
            "email": "jordan.lee@acmecommerce.com",
            "full_name": "Jordan Lee",
            "role": "support_agent",
            "is_active": True
        },
        {
            "id": LEAD_INVESTIGATOR_ID,
            "org_id": ORG_ID,
            "email": "maya.patel@acmecommerce.com",
            "full_name": "Maya Patel",
            "role": "lead_investigator",
            "is_active": True
        }
    ]
    
    # 3. Products (55 products)
    data["products"] = []
    prod_id_map = []
    for p_idx, tpl in enumerate(PRODUCT_TEMPLATES):
        p_id = deterministic_uuid("product", p_idx)
        sku = f"SKU-{tpl[1][:3].upper()}-{1000 + p_idx}"
        data["products"].append({
            "id": p_id,
            "org_id": ORG_ID,
            "sku": sku,
            "name": tpl[0],
            "category": tpl[1],
            "price_cents": tpl[2],
            "currency": "USD",
            "is_active": True
        })
        prod_id_map.append(p_id)
        
    for extra_idx in range(43):
        idx = len(PRODUCT_TEMPLATES) + extra_idx
        p_id = deterministic_uuid("product", idx)
        tpl = PRODUCT_TEMPLATES[extra_idx % len(PRODUCT_TEMPLATES)]
        variant = f" (Gen {2 + extra_idx % 3})"
        sku = f"SKU-{tpl[1][:3].upper()}-{2000 + extra_idx}"
        data["products"].append({
            "id": p_id,
            "org_id": ORG_ID,
            "sku": sku,
            "name": f"{tpl[0]}{variant}",
            "category": tpl[1],
            "price_cents": tpl[2],
            "currency": "USD",
            "is_active": True
        })
        prod_id_map.append(p_id)
        
    # 4. Customers (520 customers)
    data["customers"] = []
    data["customer_profiles"] = []
    cust_ids = []
    
    # Anchor Customer 0: Marcus Vance (Flagship Case A)
    marcus_id = deterministic_uuid("customer", 0)
    cust_ids.append(marcus_id)
    data["customers"].append({
        "id": marcus_id,
        "org_id": ORG_ID,
        "external_customer_id": "CUST-EXT-0001",
        "email": "marcus.vance@example.com",
        "phone": "+1-555-019-4821",
        "full_name": "Marcus Vance",
        "status": "active"
    })
    data["customer_profiles"].append({
        "id": deterministic_uuid("cust_prof", 0),
        "org_id": ORG_ID,
        "customer_id": marcus_id,
        "lifetime_value_cents": 185000,
        "currency": "USD",
        "loyalty_tier": "vip",
        "total_orders_count": 14,
        "total_tickets_count": 2,
        "churn_risk_score": 0.25,
        "sentiment_trend": "neutral"
    })

    # Anchor Customer 5: Elena Rostova (Case B - Delayed Refund)
    elena_id = deterministic_uuid("customer", 5)
    
    # Anchor Customer 20: David Kim (Case C - Unexpected Renewal)
    david_id = deterministic_uuid("customer", 20)

    # Anchor Customer 25: Priya Sharma (Case D - Account Locked)
    priya_id = deterministic_uuid("customer", 25)

    # Anchor Customer 30: Carlos Mendez (Case E - Product Firmware Issue)
    carlos_id = deterministic_uuid("customer", 30)

    for i in range(1, 520):
        c_id = deterministic_uuid("customer", i)
        cust_ids.append(c_id)
        if i == 5:
            fn, ln = "Elena", "Rostova"
            email = "elena.rostova@example.com"
            tier = "gold"
        elif i == 20:
            fn, ln = "David", "Kim"
            email = "david.kim@example.com"
            tier = "silver"
        elif i == 25:
            fn, ln = "Priya", "Sharma"
            email = "priya.sharma@example.com"
            tier = "bronze"
        elif i == 30:
            fn, ln = "Carlos", "Mendez"
            email = "carlos.mendez@example.com"
            tier = "silver"
        else:
            fn = FIRST_NAMES[i % len(FIRST_NAMES)]
            ln = LAST_NAMES[(i * 7) % len(LAST_NAMES)]
            email = f"{fn.lower()}.{ln.lower()}{i}@example.com"
            tier = rng.choice(["bronze", "bronze", "silver", "silver", "gold", "vip"])
            
        orders_count = rng.randint(1, 15)
        ltv = orders_count * rng.randint(4000, 15000)
        
        status = "flagged_for_fraud" if i == 25 else "active"
        data["customers"].append({
            "id": c_id,
            "org_id": ORG_ID,
            "external_customer_id": f"CUST-EXT-{1000 + i}",
            "email": email,
            "phone": f"+1-555-01{i % 100:02d}-{1000 + i:04d}",
            "full_name": f"{fn} {ln}",
            "status": status
        })
        data["customer_profiles"].append({
            "id": deterministic_uuid("cust_prof", i),
            "org_id": ORG_ID,
            "customer_id": c_id,
            "lifetime_value_cents": ltv,
            "currency": "USD",
            "loyalty_tier": tier,
            "total_orders_count": orders_count,
            "total_tickets_count": rng.randint(1, 4),
            "churn_risk_score": round(rng.uniform(0.05, 0.45), 2),
            "sentiment_trend": rng.choice(["positive", "neutral", "neutral", "positive"])
        })
        
    # 5. Orders and Order Items (510 orders)
    data["orders"] = []
    data["order_items"] = []
    
    for i in range(510):
        o_id = deterministic_uuid("order", i)
        c_id = cust_ids[i % len(cust_ids)]
        created = BASE_TIME - timedelta(days=rng.randint(1, 60), hours=rng.randint(0, 23))
        status = rng.choice(["delivered", "delivered", "delivered", "shipped", "processing", "confirmed"])
        p_id = rng.choice(prod_id_map)
        qty = rng.randint(1, 2)
        unit_price = rng.choice([2999, 4999, 7999, 12999, 14999])
        total = qty * unit_price
        
        data["orders"].append({
            "id": o_id,
            "org_id": ORG_ID,
            "customer_id": c_id,
            "order_number": f"ORD-{10000 + i}",
            "status": status,
            "total_amount_cents": total,
            "currency": "USD",
            "shipping_address": {"city": "Bengaluru", "country": "IN", "zip": "560001", "street": f"{100 + i} MG Road"},
            "fulfillment_center_id": rng.choice(["FC-BLR-01", "FC-MUM-02", "FC-DEL-01"]),
            "created_at": created.isoformat(),
            "updated_at": created.isoformat()
        })
        data["order_items"].append({
            "id": deterministic_uuid("order_item", i),
            "org_id": ORG_ID,
            "order_id": o_id,
            "product_id": p_id,
            "quantity": qty,
            "unit_price_cents": unit_price,
            "subtotal_cents": total,
            "created_at": created.isoformat()
        })
        
    # 6. Payments (525 payments)
    data["payments"] = []
    for i in range(510):
        p_id = deterministic_uuid("payment", i)
        data["payments"].append({
            "id": p_id,
            "org_id": ORG_ID,
            "customer_id": data["orders"][i]["customer_id"],
            "order_id": data["orders"][i]["id"],
            "gateway_transaction_id": f"ch_stripe_{100000 + i}",
            "gateway_name": "stripe",
            "amount_cents": data["orders"][i]["total_amount_cents"],
            "currency": "USD",
            "status": "captured",
            "failure_code": None,
            "failure_message": None,
            "raw_gateway_response": {"paid": True, "captured": True, "seller_message": "Payment complete."},
            "created_at": data["orders"][i]["created_at"],
            "updated_at": data["orders"][i]["created_at"]
        })
        
    # Extra 15 payments for Incident 1 (Captured in Stripe, but order record dropped)
    inc1_cust_ids = [marcus_id] + [cust_ids[10 + k] for k in range(14)]
    for inc_idx, c_id in enumerate(inc1_cust_ids):
        extra_p_id = deterministic_uuid("payment", 510 + inc_idx)
        p_time = BASE_TIME - timedelta(minutes=28 - inc_idx)
        data["payments"].append({
            "id": extra_p_id,
            "org_id": ORG_ID,
            "customer_id": c_id,
            "order_id": None, # Dropped webhook! Order missing
            "gateway_transaction_id": f"ch_stripe_orphaned_{9000 + inc_idx}",
            "gateway_name": "stripe",
            "amount_cents": 4999,
            "currency": "USD",
            "status": "captured",
            "failure_code": None,
            "failure_message": None,
            "raw_gateway_response": {"paid": True, "captured": True, "charge_id": f"ch_stripe_orphaned_{9000 + inc_idx}"},
            "created_at": p_time.isoformat(),
            "updated_at": p_time.isoformat()
        })
        
    # 7. Service Events & System Logs (28 events)
    data["service_events"] = []
    # Primary Case A Service Event: Dropped Webhook / Redis Connection Pool Timeout
    for r_i in range(3):
        data["service_events"].append({
            "id": deterministic_uuid("service_evt", r_i),
            "org_id": ORG_ID,
            "service_name": "payment-webhook-worker",
            "event_type": "redis_enqueue_timeout",
            "severity": "critical",
            "payload": {
                "gateway": "stripe",
                "affected_topic": "orders.create",
                "error": "Redis connection pool timeout (5000ms). Dropping webhook event enqueue.",
                "dropped_batch_size": 15
            },
            "trace_id": f"tr_redis_timeout_00{r_i}",
            "created_at": (BASE_TIME - timedelta(minutes=30 - r_i * 2)).isoformat()
        })
    # Case B Service Event: Clearinghouse Banking Settlement Timeout
    data["service_events"].append({
        "id": deterministic_uuid("service_evt", 3),
        "org_id": ORG_ID,
        "service_name": "refund-settlement-cron",
        "event_type": "banking_settlement_timeout",
        "severity": "error",
        "payload": {
            "error": "Handshake timeout with ACH clearinghouse batch endpoint",
            "retry_count": 3,
            "clearinghouse_batch_id": "BATCH-ACH-2026-09"
        },
        "trace_id": "tr_bank_timeout_01",
        "created_at": (BASE_TIME - timedelta(hours=48)).isoformat()
    })
    # Case C Service Event: Subscription Vault Token Decryption Error
    data["service_events"].append({
        "id": deterministic_uuid("service_evt", 4),
        "org_id": ORG_ID,
        "service_name": "subscription-billing-vault",
        "event_type": "token_decryption_error",
        "severity": "error",
        "payload": {
            "error": "Vault key rotation version mismatch for token series 2024-B",
            "key_version": 4,
            "vault_partition": "us-east-sub-vault"
        },
        "trace_id": "tr_vault_error_02",
        "created_at": (BASE_TIME - timedelta(hours=72)).isoformat()
    })
    # Case D Service Event: Auth Service Rate Limit Lockout
    data["service_events"].append({
        "id": deterministic_uuid("service_evt", 5),
        "org_id": ORG_ID,
        "service_name": "auth-service",
        "event_type": "rate_limit_lockout",
        "severity": "warning",
        "payload": {
            "error": "Account temporarily locked: exceeded 5 consecutive failed password reset verification attempts",
            "target_user": "priya.sharma@example.com",
            "lockout_duration_minutes": 60
        },
        "trace_id": "tr_auth_lockout_01",
        "created_at": (BASE_TIME - timedelta(hours=2)).isoformat()
    })
    # Case E Service Event: Hardware OTA Firmware Flash Failure
    data["service_events"].append({
        "id": deterministic_uuid("service_evt", 6),
        "org_id": ORG_ID,
        "service_name": "device-ota-service",
        "event_type": "firmware_ota_failure",
        "severity": "warning",
        "payload": {
            "sku": "SKU-AUD-1000",
            "firmware_version": "v2.4.1",
            "error": "Checksum mismatch during over-the-air firmware flash. Device entered recovery fallback mode."
        },
        "trace_id": "tr_ota_firmware_01",
        "created_at": (BASE_TIME - timedelta(hours=12)).isoformat()
    })

    # Normal operational service events
    normal_services = ["auth-service", "order-router", "storefront-api", "inventory-sync"]
    for s_i in range(7, 28):
        data["service_events"].append({
            "id": deterministic_uuid("service_evt", s_i),
            "org_id": ORG_ID,
            "service_name": normal_services[s_i % len(normal_services)],
            "event_type": "session_refreshed" if s_i % 2 == 0 else "inventory_reserved",
            "severity": "info",
            "payload": {"status": "ok", "latency_ms": rng.randint(15, 180)},
            "trace_id": f"tr_norm_{100 + s_i}",
            "created_at": (BASE_TIME - timedelta(hours=rng.randint(1, 40))).isoformat()
        })
        
    # 8. Product Events (40 product events)
    data["product_events"] = []
    for pe_i in range(40):
        data["product_events"].append({
            "id": deterministic_uuid("prod_evt", pe_i),
            "org_id": ORG_ID,
            "customer_id": cust_ids[pe_i % len(cust_ids)],
            "session_id": f"sess_{1000 + pe_i}",
            "event_name": rng.choice(["checkout_started", "payment_attempted", "order_confirmed", "cart_viewed"]),
            "page_url": "https://shop.acmecommerce.com/checkout",
            "properties": {"device": "desktop", "browser": "Chrome"},
            "created_at": (BASE_TIME - timedelta(hours=rng.randint(1, 72))).isoformat()
        })
        
    # 9. Refunds (45 refunds)
    data["refunds"] = []
    for rf_i in range(45):
        rf_id = deterministic_uuid("refund", rf_i)
        status = "processing" if rf_i < 5 else "completed"
        data["refunds"].append({
            "id": rf_id,
            "org_id": ORG_ID,
            "payment_id": data["payments"][rf_i]["id"],
            "order_id": data["orders"][rf_i]["id"],
            "customer_id": data["orders"][rf_i]["customer_id"],
            "approved_by_user_id": AGENT_USER_1_ID,
            "amount_cents": 7999,
            "currency": "USD",
            "status": status,
            "reason": "Customer returned unopened hardware item within 30-day window",
            "is_automated": False,
            "created_at": (BASE_TIME - timedelta(days=rng.randint(2, 20))).isoformat(),
            "updated_at": BASE_TIME.isoformat()
        })
        
    # 10. Subscriptions (50 subscriptions)
    data["subscriptions"] = []
    for sub_i in range(50):
        sub_id = deterministic_uuid("subscription", sub_i)
        c_id = david_id if sub_i == 0 else cust_ids[sub_i]
        data["subscriptions"].append({
            "id": sub_id,
            "org_id": ORG_ID,
            "customer_id": c_id,
            "product_id": prod_id_map[0],
            "status": "active" if sub_i != 4 else "past_due",
            "billing_interval": "yearly" if sub_i == 0 else "monthly",
            "current_period_start": (BASE_TIME - timedelta(days=362 if sub_i == 0 else 15)).isoformat(),
            "current_period_end": (BASE_TIME + timedelta(days=3 if sub_i == 0 else 15)).isoformat(),
            "cancel_at_period_end": False,
            "created_at": (BASE_TIME - timedelta(days=365)).isoformat(),
            "updated_at": BASE_TIME.isoformat()
        })

    # 11. Tickets & Ticket Messages (315 tickets, 800+ messages)
    data["tickets"] = []
    data["ticket_messages"] = []
    ticket_id_map = []
    msg_id_counter = 0

    # --------------------------------------------------------------------------
    # Flagship CASE A: Marcus Vance (TCK-10000)
    # "My payment went through but my order is missing."
    # --------------------------------------------------------------------------
    t_id_0 = deterministic_uuid("ticket", 0)
    ticket_id_map.append(t_id_0)
    t_time_0 = BASE_TIME - timedelta(minutes=25)
    data["tickets"].append({
        "id": t_id_0,
        "org_id": ORG_ID,
        "customer_id": marcus_id,
        "assigned_agent_id": AGENT_USER_1_ID,
        "incident_id": None,
        "ticket_number": "TCK-10000",
        "subject": "Payment was successful but my order is missing",
        "status": "investigating",
        "priority": "high",
        "intent_category": "payment_successful_order_missing",
        "sentiment_score": -0.75,
        "is_escalated": False,
        "ai_confidence": 0.94,
        "recommended_team": "Billing",
        "ai_resolvable": True,
        "complexity": "medium",
        "created_at": t_time_0.isoformat(),
        "updated_at": t_time_0.isoformat()
    })
    data["ticket_messages"].append({
        "id": deterministic_uuid("ticket_msg", msg_id_counter),
        "org_id": ORG_ID,
        "ticket_id": t_id_0,
        "sender_user_id": None,
        "sender_type": "customer",
        "content": "Hi, I completed my purchase 25 minutes ago and my bank says $49.99 was charged by Acme, but I haven't received any confirmation email and my orders page is completely empty! Can you help me find my order?",
        "attachments": [],
        "metadata": {"channel": "portal", "device": "mobile"},
        "created_at": t_time_0.isoformat()
    })
    msg_id_counter += 1
    data["ticket_messages"].append({
        "id": deterministic_uuid("ticket_msg", msg_id_counter),
        "org_id": ORG_ID,
        "ticket_id": t_id_0,
        "sender_user_id": AGENT_USER_1_ID,
        "sender_type": "human_agent",
        "content": "Hello Marcus, thank you for reaching out. I see your captured payment for $49.99 on Stripe. I am currently running an investigation with our order processing team to trace the missing order confirmation.",
        "attachments": [],
        "metadata": {"channel": "portal"},
        "created_at": (t_time_0 + timedelta(minutes=2)).isoformat()
    })
    msg_id_counter += 1

    # Incident 1 sibling tickets (TCK-10001 to TCK-10004)
    inc1_complaints = [
        ("Charged on credit card but no confirmation email or order number", "Hello, my card was charged $49.99 at 2:18 PM UTC today for the OmniCharge wireless station. Cart emptied out but no order shows up in my account."),
        ("Money deducted on Apple Pay, cart checkout error", "I paid via Apple Pay on my phone. The payment went through immediately according to my wallet, but the app crashed back to the home screen and my orders list is blank."),
        ("Order confirmation not received after successful payment", "I was charged $49.99 half an hour ago. The checkout page said processing and then redirected to my profile, but no order was created. Please confirm receipt."),
        ("Missing order ORD after Stripe card charge", "Stripe sent an authorization SMS and money left my account for $49.99, but where is my order? Please check urgently.")
    ]
    for idx_inc1, (subj, body) in enumerate(inc1_complaints, start=1):
        t_id = deterministic_uuid("ticket", idx_inc1)
        ticket_id_map.append(t_id)
        c_id = inc1_cust_ids[idx_inc1]
        t_time = BASE_TIME - timedelta(minutes=25 - (idx_inc1 * 3))
        data["tickets"].append({
            "id": t_id,
            "org_id": ORG_ID,
            "customer_id": c_id,
            "assigned_agent_id": None,
            "incident_id": None,
            "ticket_number": f"TCK-{10000 + idx_inc1}",
            "subject": subj,
            "status": "open",
            "priority": "high",
            "intent_category": "payment_successful_order_missing",
            "sentiment_score": -0.70,
            "is_escalated": False,
            "ai_confidence": 0.93,
            "recommended_team": "Billing",
            "ai_resolvable": True,
            "complexity": "medium",
            "created_at": t_time.isoformat(),
            "updated_at": t_time.isoformat()
        })
        data["ticket_messages"].append({
            "id": deterministic_uuid("ticket_msg", msg_id_counter),
            "org_id": ORG_ID,
            "ticket_id": t_id,
            "sender_user_id": None,
            "sender_type": "customer",
            "content": body,
            "attachments": [],
            "metadata": {"channel": "portal"},
            "created_at": t_time.isoformat()
        })
        msg_id_counter += 1

    # --------------------------------------------------------------------------
    # CASE B: Elena Rostova (TCK-10005)
    # "Refund has not arrived."
    # --------------------------------------------------------------------------
    t_id_b = deterministic_uuid("ticket", 5)
    ticket_id_map.append(t_id_b)
    t_time_b = BASE_TIME - timedelta(hours=14)
    data["tickets"].append({
        "id": t_id_b,
        "org_id": ORG_ID,
        "customer_id": elena_id,
        "assigned_agent_id": AGENT_USER_2_ID,
        "incident_id": None,
        "ticket_number": "TCK-10005",
        "subject": "Return completed 8 days ago but refund still processing",
        "status": "open",
        "priority": "high",
        "intent_category": "delayed_refund",
        "sentiment_score": -0.65,
        "is_escalated": False,
        "ai_confidence": 0.92,
        "recommended_team": "Billing",
        "ai_resolvable": True,
        "complexity": "medium",
        "created_at": t_time_b.isoformat(),
        "updated_at": t_time_b.isoformat()
    })
    data["ticket_messages"].append({
        "id": deterministic_uuid("ticket_msg", msg_id_counter),
        "org_id": ORG_ID,
        "ticket_id": t_id_b,
        "sender_user_id": None,
        "sender_type": "customer",
        "content": "My returned headphones arrived at your warehouse 8 days ago. Tracking confirmed inspection was complete, but my $79.99 refund status is still stuck on 'Processing'. Can someone check why my bank hasn't received it?",
        "attachments": [],
        "metadata": {"channel": "email"},
        "created_at": t_time_b.isoformat()
    })
    msg_id_counter += 1

    # Incident 2 sibling tickets (TCK-10006 to TCK-10008)
    inc2_complaints = [
        ("Where is my refund for order ORD-10022?", "It has been over 7 business days since customer service authorized my refund. Can someone check why my bank hasn't received it?"),
        ("Delay in refund payment to card", "I was told my $79.99 refund would arrive within 3-5 days. Still nothing on my credit card statement."),
        ("Refund status stuck on processing", "Support promised my return refund would clear by yesterday. Please expedite this.")
    ]
    for idx_inc2, (subj, body) in enumerate(inc2_complaints, start=6):
        t_id = deterministic_uuid("ticket", idx_inc2)
        ticket_id_map.append(t_id)
        c_id = cust_ids[30 + idx_inc2]
        t_time = BASE_TIME - timedelta(hours=12)
        data["tickets"].append({
            "id": t_id,
            "org_id": ORG_ID,
            "customer_id": c_id,
            "assigned_agent_id": AGENT_USER_2_ID,
            "incident_id": None,
            "ticket_number": f"TCK-{10000 + idx_inc2}",
            "subject": subj,
            "status": "open",
            "priority": "medium",
            "intent_category": "delayed_refund",
            "sentiment_score": -0.60,
            "is_escalated": False,
            "ai_confidence": 0.90,
            "recommended_team": "Billing",
            "ai_resolvable": True,
            "complexity": "medium",
            "created_at": t_time.isoformat(),
            "updated_at": t_time.isoformat()
        })
        data["ticket_messages"].append({
            "id": deterministic_uuid("ticket_msg", msg_id_counter),
            "org_id": ORG_ID,
            "ticket_id": t_id,
            "sender_user_id": None,
            "sender_type": "customer",
            "content": body,
            "attachments": [],
            "metadata": {},
            "created_at": t_time.isoformat()
        })
        msg_id_counter += 1

    # --------------------------------------------------------------------------
    # Normal tickets & Anchored Cases C, D, E
    # --------------------------------------------------------------------------
    for t_i in range(9, 315):
        t_id = deterministic_uuid("ticket", t_i)
        ticket_id_map.append(t_id)
        
        # Specific anchor for Case C: David Kim (TCK-10020)
        if t_i == 20:
            c_id = david_id
            created = BASE_TIME - timedelta(hours=6)
            subj = "Subscription renewed unexpectedly"
            body = "Hi Acme Support, my annual subscription for AcmeCare+ Cloud Sync was renewed yesterday and $120 was charged to my card. I intended to cancel before the renewal period. Can I cancel and receive a refund per your policy?"
            status = "open"
            priority = "medium"
            cat = "subscription"
            team = "Billing"
            ai_conf = 0.91
            ai_res = True
            comp = "low"
            sentiment = -0.40
        # Specific anchor for Case D: Priya Sharma (TCK-10025)
        elif t_i == 25:
            c_id = priya_id
            created = BASE_TIME - timedelta(hours=2)
            subj = "Account locked after password reset"
            body = "I tried to reset my password earlier today after forgetting it. The system showed an error 'Rate limit exceeded' and now my account is completely locked out! I need to access my order history immediately."
            status = "open"
            priority = "high"
            cat = "account"
            team = "Account Security"
            ai_conf = 0.95
            ai_res = False # Human review required for security unlock
            comp = "medium"
            sentiment = -0.80
        # Specific anchor for Case E: Carlos Mendez (TCK-10030)
        elif t_i == 30:
            c_id = carlos_id
            created = BASE_TIME - timedelta(hours=8)
            subj = "Product stopped working after update"
            body = "I ran the firmware update v2.4.1 on my AeroTune Wireless Headphones this morning via the mobile app. The update reached 90% and failed, and now the headphones will not power on or show any LED light. How do I recover them?"
            status = "open"
            priority = "medium"
            cat = "technical"
            team = "Technical Support"
            ai_conf = 0.88
            ai_res = True
            comp = "medium"
            sentiment = -0.60
        else:
            c_id = cust_ids[(t_i * 3) % len(cust_ids)]
            created = BASE_TIME - timedelta(days=rng.randint(1, 45), hours=rng.randint(0, 23))
            tpl_conv = rng.choice(NORMAL_CONVERSATION_SETS)
            subj = tpl_conv[0]
            body = tpl_conv[1]
            status = rng.choice(["resolved", "resolved", "closed", "open", "waiting_customer"])
            priority = rng.choice(["low", "medium", "medium", "high"])
            cat = "general_inquiry"
            team = rng.choice(["Order Operations", "Technical Support", "Billing", "General Triage"])
            ai_conf = round(rng.uniform(0.78, 0.95), 2)
            ai_res = True
            comp = rng.choice(["low", "medium"])
            sentiment = round(rng.uniform(-0.2, 0.4), 2)
            
        data["tickets"].append({
            "id": t_id,
            "org_id": ORG_ID,
            "customer_id": c_id,
            "assigned_agent_id": rng.choice([AGENT_USER_1_ID, AGENT_USER_2_ID, None]),
            "incident_id": None,
            "ticket_number": f"TCK-{10000 + t_i}",
            "subject": subj,
            "status": status,
            "priority": priority,
            "intent_category": cat,
            "sentiment_score": sentiment,
            "is_escalated": False,
            "ai_confidence": ai_conf,
            "recommended_team": team,
            "ai_resolvable": ai_res,
            "complexity": comp,
            "created_at": created.isoformat(),
            "updated_at": created.isoformat()
        })
        
        # Turn 1: Customer message
        data["ticket_messages"].append({
            "id": deterministic_uuid("ticket_msg", msg_id_counter),
            "org_id": ORG_ID,
            "ticket_id": t_id,
            "sender_type": "customer",
            "content": body,
            "attachments": [],
            "metadata": {},
            "created_at": created.isoformat()
        })
        msg_id_counter += 1
        
        # Turn 2: Agent reply if resolved
        if status in ["resolved", "closed", "waiting_customer"] and t_i not in [20, 25, 30]:
            reply_time = created + timedelta(minutes=rng.randint(15, 60))
            data["ticket_messages"].append({
                "id": deterministic_uuid("ticket_msg", msg_id_counter),
                "org_id": ORG_ID,
                "ticket_id": t_id,
                "sender_user_id": AGENT_USER_1_ID,
                "sender_type": "human_agent",
                "content": tpl_conv[2],
                "attachments": [],
                "metadata": {},
                "created_at": reply_time.isoformat()
            })
            msg_id_counter += 1

    # 12. Escalations (18 escalations)
    data["escalations"] = []
    for esc_i in range(18):
        t_id = ticket_id_map[esc_i]
        data["escalations"].append({
            "id": deterministic_uuid("escalation", esc_i),
            "org_id": ORG_ID,
            "ticket_id": t_id,
            "escalation_reason": "High customer sentiment distress and unresolved transaction state",
            "executive_summary": "Customer paid for merchandise but order failed ingestion due to backend timeout.",
            "recommended_resolution": "Recreate order in warehouse pipeline with Priority Next-Day shipping.",
            "urgency": rng.choice(["normal", "urgent", "critical"]),
            "status": "pending" if esc_i < 6 else "in_review",
            "created_at": (BASE_TIME - timedelta(hours=rng.randint(1, 24))).isoformat(),
            "updated_at": BASE_TIME.isoformat()
        })

    # --------------------------------------------------------------------------
    # 13. Policy Documents (7 comprehensive Acme Commerce documents)
    # --------------------------------------------------------------------------
    policies_raw = [
        (
            1, "Payment Confirmation Policy", "payment",
            """# Acme Commerce Payment Confirmation & Gateway Settlement Policy

### Section 1: Payment Capture SLA
Acme Commerce processes customer payments through authorized gateways (Stripe, Razorpay, PayPal). Upon successful card authorization, the gateway transmits a synchronous webhook payload (`charge.captured`) to Acme's payment worker. Captured funds are guaranteed by the gateway.

### Section 2: Order Generation Timeline
An order record must be generated within 15 seconds of payment webhook receipt. If the webhook delivery fails due to Redis queue timeouts or infrastructure drops, the payment status remains captured on the gateway while the customer's order list appears empty.

### Section 3: Discrepancy Resolution
Customer support agents and automated intelligence are authorized to inspect gateway charge hashes (`ch_*`). When a verified captured payment has no linked order number, the case is assigned high priority for immediate order synchronization or advance order recreation with zero customer penalty."""
        ),
        (
            2, "Refund Processing Policy", "refund",
            """# Standard 30-Day Return & Refund Processing Policy

### Section 1: Return Eligibility Window
Customers may return any hardware item within 30 days of physical delivery for a 100% full refund to the original payment method. Items returned between 31 and 45 days are eligible for store credit only.

### Section 2: Warehouse Inspection & Settlement Timing
Once a return package is received and inspected at an Acme fulfillment center, refund processing is initiated within 2 business days. Bank settlement typically requires 3 to 5 business days via standard ACH or card network clearinghouses.

### Section 3: Clearinghouse Delays
If a refund remains in 'processing' status beyond 7 business days, support must investigate clearinghouse batch timeouts. Agents must verify gateway batch IDs (`BATCH-ACH-*`) before re-initiating transfer."""
        ),
        (
            3, "Order Cancellation Policy", "cancellation",
            """# Acme Commerce Order Cancellation & Modification Policy

### Section 1: Pre-Fulfillment Cancellation Window
Customers may cancel or modify order line items without fee or penalty while the order is in 'pending' or 'processing' status prior to warehouse staging.

### Section 2: Shipped Orders Lockout
Once an order status transitions to 'shipped' and a carrier tracking number is generated, automated cancellation is locked. The customer must receive the parcel and initiate a standard 30-day return.

### Section 3: Instant Refund on Cancellation
For orders successfully cancelled prior to warehouse dispatch, authorization holds are voided immediately, and captured credit card funds are reversed within 24 hours."""
        ),
        (
            4, "Subscription Renewal Policy", "subscription",
            """# AcmeCare Subscription Renewal, Billing & Grace Period Policy

### Section 1: Renewal Billing Cycles
Subscriptions (such as AcmeCare+ Hardware Protection and Cloud Sync) renew automatically on a monthly or annual billing interval. Automated billing reminders are dispatched via email 7 days prior to renewal.

### Section 2: Vault Token Rotation & Billing Failures
Recurring subscription charges utilize tokenized vault credentials. In the event of a token decryption error or card expiration, customer accounts enter a 7-day active grace period during which service remains active.

### Section 3: Accidental Renewals Refund Guarantee
Customers who did not intend to renew an annual plan may request a full refund within 14 days of the renewal charge, provided no hardware replacement claims were processed during that window."""
        ),
        (
            5, "Account Security Policy", "security",
            """# Acme Commerce Customer Account Security & Access Recovery Policy

### Section 1: Automated Lockout Triggers
To protect customer privacy and payment tokens, customer accounts are automatically locked after 5 consecutive failed login attempts or 3 rapid password reset request errors within a 15-minute window.

### Section 2: Identity Verification & Safe Unlocking
When an account is locked due to auth-service rate limiting or session invalidation, support agents must verify the account owner's email and external customer ID. Once verified, agents can trigger a secure single-use 15-minute magic recovery link.

### Section 3: Session Revocation
Password reset operations immediately terminate all active web sessions across all devices to mitigate unauthorized session hijacking."""
        ),
        (
            6, "Product Troubleshooting Guide", "troubleshooting",
            """# AeroTune & Acme Smart Devices Hardware Troubleshooting Guide

### Section 1: Firmware Update Recovery for AeroTune Headphones
If AeroTune Wireless Headphones become unresponsive or fail to play audio following an over-the-air firmware update, perform a hardware power reset: Hold the Power and Volume Down buttons simultaneously for 12 seconds until the LED pulses purple.

### Section 2: Bluetooth Pairing Desync
When audio drops or the device fails to connect, clear the device pairing memory by pressing the Bluetooth button for 7 seconds. Ensure the Acme Audio companion app is running version 2.4.0 or higher.

### Section 3: Defective Hardware Replacement
If a device fails hard-reset diagnostics and is within its 1-year manufacturer warranty, support issues a prepaid return label and dispatches an immediate advance replacement unit."""
        ),
        (
            7, "Support Escalation Policy", "escalation",
            """# Operational Support Escalation & Human Handoff SLA Policy

### Section 1: Tier Escalation Criteria
Cases are escalated from automated intelligence to human specialists when: (a) AI confidence degrades below 0.70; (b) the customer expresses severe sentiment distress or threatens chargeback actions; (c) the issue involves financial discrepancy greater than $100; or (d) multi-service infrastructure errors are detected.

### Section 2: Response Time SLAs
Critical escalations mandate human agent pickup within 15 minutes. High-priority cases require response within 1 hour. Standard escalations must be handled within 4 business hours.

### Section 3: Warm Diagnostic Handoff
All escalations must include an executive diagnostic summary, verified entity IDs, evidence hashes, and recommended next action."""
        )
    ]

    data["policy_documents"] = []
    data["knowledge_sources"] = []
    data["knowledge_chunks"] = []
    chunk_counter = 0

    for p_num, title, category, content in policies_raw:
        pol_id = deterministic_uuid("policy", p_num)
        data["policy_documents"].append({
            "id": pol_id,
            "org_id": ORG_ID,
            "title": title,
            "category": category,
            "content_markdown": content,
            "version": 1,
            "is_active": True
        })

        src_id = deterministic_uuid("knowledge_src", p_num)
        collection_name = f"acme_{category}_kb"
        
        # Split into section-level chunks
        sections = content.split("### ")
        chunk_count_for_src = 0
        for s_idx, sec_text in enumerate(sections):
            sec_text = sec_text.strip()
            if not sec_text:
                continue
            lines = sec_text.split("\n", 1)
            sec_title = lines[0].replace("#", "").strip()
            sec_body = lines[1].strip() if len(lines) > 1 else sec_text

            chunk_id = deterministic_uuid("chunk", chunk_counter)
            data["knowledge_chunks"].append({
                "id": chunk_id,
                "org_id": ORG_ID,
                "source_id": src_id,
                "policy_id": pol_id,
                "chunk_index": chunk_count_for_src,
                "title": title,
                "section": sec_title,
                "content": f"Document: {title}\nSection: {sec_title}\n\n{sec_body}",
                "metadata": {
                    "category": category,
                    "policy_id": pol_id,
                    "version": 1,
                    "org_id": ORG_ID
                }
            })
            chunk_counter += 1
            chunk_count_for_src += 1

        data["knowledge_sources"].append({
            "id": src_id,
            "org_id": ORG_ID,
            "policy_id": pol_id,
            "source_type": "policy_manual",
            "title": title,
            "chroma_collection_name": collection_name,
            "total_chunks": chunk_count_for_src,
            "last_synced_at": BASE_TIME.isoformat()
        })

    # 14. AI Agents Registry (12 Specialist Agents)
    agent_names = [
        ("Supervisor / Orchestrator Agent", "Plans case workflow, schedules specialist invocations, and arbitrates final resolution decisions.", "gemini-2.0-flash"),
        ("Intent & Routing Agent", "Classifies customer message semantics, primary intent, urgency, and distress score.", "gemini-2.0-flash"),
        ("Billing Agent", "Audits payment gateway captures, authorization codes, and bank settlement status.", "gemini-2.0-flash"),
        ("Order Agent", "Verifies warehouse fulfillment, inventory reservations, and carrier tracking.", "gemini-2.0-flash"),
        ("Refund Agent", "Calculates deterministic refund eligibility and policy return window limits.", "gemini-2.0-flash"),
        ("Account Agent", "Inspects customer 360 profile, loyalty tier, lifetime value, and fraud risk score.", "gemini-2.0-flash"),
        ("Technical / Service Agent", "Inspects microservice error logs, webhook delivery drops, and infrastructure events.", "gemini-2.0-flash"),
        ("Policy / Knowledge Agent", "Grounds decisions in authoritative corporate policies via semantic ChromaDB vector retrieval.", "gemini-2.0-flash"),
        ("Incident Investigation Agent", "Evaluates multi-signal correlations across open tickets to detect systemic incidents.", "gemini-1.5-pro"),
        ("Resolution Agent", "Synthesizes specialist findings into concrete remediation plans and customer drafts.", "gemini-1.5-pro"),
        ("Escalation Agent", "Assembles structured diagnostic handoff briefs for human operators.", "gemini-2.0-flash"),
        ("CX Analytics Agent", "Analyzes post-resolution SLA compliance, MTTR reduction, and churn prevention metrics.", "gemini-2.0-flash")
    ]
    data["agents"] = []
    for a_idx, (name, role, model) in enumerate(agent_names):
        data["agents"].append({
            "id": deterministic_uuid("agent", a_idx),
            "name": name,
            "role_description": role,
            "model_name": model,
            "is_active": True
        })

    # 15. Actions Catalog (6 actions)
    action_items = [
        ("recreate_order", "Re-inject dropped order into warehouse fulfillment pipeline", 15000, True),
        ("issue_refund", "Issue direct financial refund to original payment method", 5000, False),
        ("apply_courtesy_credit", "Apply customer loyalty store credit to account balance", 2500, False),
        ("resend_webhook", "Re-dispatch failed payment webhook payload to order worker", 0, True),
        ("escalate_human", "Hand off case to senior human triage queue with diagnostic brief", 0, True),
        ("expedite_shipping", "Upgrade existing order fulfillment to Priority Next-Day Air", 3500, True)
    ]
    data["actions"] = []
    for act_idx, (key, desc, limit, rev) in enumerate(action_items):
        data["actions"].append({
            "id": deterministic_uuid("action", act_idx),
            "action_key": key,
            "description": desc,
            "max_financial_limit_cents": limit,
            "is_reversible": rev
        })
        
    return data

if __name__ == "__main__":
    print("Generating deterministic Acme Commerce synthetic dataset (seed=42)...")
    dataset = generate_all_data()
    print(f"Generated:")
    print(f"  - Organizations: {len(dataset['organizations'])}")
    print(f"  - Users: {len(dataset['users'])}")
    print(f"  - Customers: {len(dataset['customers'])}")
    print(f"  - Customer Profiles: {len(dataset['customer_profiles'])}")
    print(f"  - Products: {len(dataset['products'])}")
    print(f"  - Orders: {len(dataset['orders'])}")
    print(f"  - Payments: {len(dataset['payments'])}")
    print(f"  - Refunds: {len(dataset['refunds'])}")
    print(f"  - Subscriptions: {len(dataset['subscriptions'])}")
    print(f"  - Service Events: {len(dataset['service_events'])}")
    print(f"  - Product Events: {len(dataset['product_events'])}")
    print(f"  - Tickets: {len(dataset['tickets'])}")
    print(f"  - Ticket Messages: {len(dataset['ticket_messages'])}")
    print(f"  - Escalations: {len(dataset['escalations'])}")
    print(f"  - Policy Documents: {len(dataset['policy_documents'])}")
    print(f"  - Knowledge Sources: {len(dataset['knowledge_sources'])}")
    print(f"  - Knowledge Chunks: {len(dataset['knowledge_chunks'])}")
    print(f"  - AI Agents: {len(dataset['agents'])}")
    print(f"  - Actions: {len(dataset['actions'])}")
    
    import os
    os.makedirs("data/fixtures", exist_ok=True)
    with open("data/fixtures/acme_commerce_fixtures.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print("Saved JSON fixture: data/fixtures/acme_commerce_fixtures.json")
