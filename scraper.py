"""
LeadFlow Nigeria — Google Places API (New) Scraper
Scrapes businesses across Nigerian states and pushes to Supabase.
"""

import requests
import time
from supabase import create_client

# ── CONFIG ───────────────────────────────────────────────────────────────────
GOOGLE_API_KEY = "AIzaSyDzGTwpWp9n5tCP3i3a2LYDjqR48eKddaY"
SUPABASE_URL   = "https://jyigungffdpqdgknhqao.supabase.co"
SUPABASE_KEY   = "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── TARGETS ──────────────────────────────────────────────────────────────────
BUSINESS_TYPES = [
    "supermarket", "pharmacy", "hotel", "restaurant", "hospital",
    "school", "logistics company", "filling station", "hardware store",
    "fashion shop", "electronics store", "church", "mosque",
    "market", "salon", "bakery", "printing press", "clinic",
]

CITIES = [
    "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan",
    "Enugu", "Kaduna", "Benin City", "Owerri", "Uyo",
    "Warri", "Onitsha", "Calabar", "Jos", "Maiduguri",
    "Ilorin", "Abeokuta", "Akure", "Ado-Ekiti", "Bauchi",
]

# ── TIER + SCORE ──────────────────────────────────────────────────────────────
def assign_tier(business_type, name):
    combined = (business_type + " " + name).lower()
    if any(k in combined for k in ["hospital", "hotel", "school", "logistics", "filling station", "clinic"]):
        return "Corporate"
    if any(k in combined for k in ["market", "salon", "church", "mosque", "bakery"]):
        return "Mass Market"
    return "SME"

def calc_score(place):
    score = 40
    rating = place.get("rating", 0)
    reviews = place.get("userRatingCount", 0)
    if rating:
        score += min(int(rating * 4), 20)
    if reviews > 50:
        score += 10
    if place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"):
        score += 10
    if place.get("websiteUri"):
        score += 10
    tier = assign_tier(place.get("primaryTypeDisplayName", {}).get("text", ""), place.get("displayName", {}).get("text", ""))
    if tier == "Corporate":
        score += 10
    return min(score, 100)

# ── NEW PLACES API SEARCH ─────────────────────────────────────────────────────
def search_places_new(query, city):
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.websiteUri,places.location"
    }
    body = {
        "textQuery": f"{query} in {city}, Nigeria",
        "maxResultCount": 20,
        "languageCode": "en"
    }
    results = []
    try:
        r = requests.post(url, headers=headers, json=body, timeout=15)
        data = r.json()
        if "places" in data:
            results = data["places"]
        elif "error" in data:
            print(f"\n    API error: {data['error'].get('message','unknown')}")
    except Exception as e:
        print(f"\n    Request error: {e}")
    return results

# ── PUSH TO SUPABASE ──────────────────────────────────────────────────────────
def push_lead(place, city, business_type):
    name    = place.get("displayName", {}).get("text", "").strip()
    phone   = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber") or None
    address = place.get("formattedAddress", city).strip()
    btype   = place.get("primaryTypeDisplayName", {}).get("text", business_type).title()
    tier    = assign_tier(btype, name)
    score   = calc_score(place)

    if not name:
        return False

    # Avoid duplicates
    check = supabase.table("leads").select("id").eq("name", name).eq("location", city).execute()
    if check.data:
        return False

    lead = {
        "name":          name,
        "phone":         phone,
        "location":      city,
        "tier":          tier,
        "score":         score,
        "source":        "Google Maps",
        "status":        "New",
        "agent":         None,
        "income":        None,
        "business_type": btype,
        "notes":         address,
    }

    result = supabase.table("leads").insert(lead).execute()
    return bool(result.data)

# ── MAIN ──────────────────────────────────────────────────────────────────────
def run():
    total_added   = 0
    total_skipped = 0

    for city in CITIES:
        print(f"\n📍 Scraping {city}...")
        for btype in BUSINESS_TYPES:
            print(f"  🔍 {btype}...", end=" ", flush=True)
            try:
                places = search_places_new(btype, city)
                added = 0
                for p in places:
                    success = push_lead(p, city, btype)
                    if success:
                        added += 1
                        total_added += 1
                    else:
                        total_skipped += 1
                print(f"✓ {added} added")
            except Exception as e:
                print(f"✗ Error: {e}")
            time.sleep(0.3)

    print(f"\n✅ Done! {total_added} leads added, {total_skipped} skipped (duplicates).")

if __name__ == "__main__":
    run()
