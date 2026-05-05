"""Integration test with real database."""

import requests

BASE_URL = "http://localhost:8002"


def test_collect_with_order():
    """Test collect endpoint creates order on pay action."""
    session_id = "test-order-session-001"
    user_id = "user-001"

    # 1. landing
    resp = requests.post(
        f"{BASE_URL}/api/v1/collect",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "action": "landing",
            "current_state": "landing",
        },
    )
    print(f"1. Landing: {resp.json()['data']['page_state']['page_subtype']}")

    # 2. browse
    resp = requests.post(
        f"{BASE_URL}/api/v1/collect",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "action": "browse",
            "current_state": "landing",
        },
    )
    print(f"2. Browse: {resp.json()['data']['page_state']['page_subtype']}")

    # 3. add_cart
    resp = requests.post(
        f"{BASE_URL}/api/v1/collect",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "action": "add_cart",
            "current_state": "browse",
        },
    )
    print(f"3. Add Cart: {resp.json()['data']['page_state']['page_subtype']}")

    # 4. pay - should create order
    resp = requests.post(
        f"{BASE_URL}/api/v1/collect",
        json={
            "session_id": session_id,
            "user_id": user_id,
            "action": "pay",
            "current_state": "cart",
        },
    )
    data = resp.json()["data"]
    order_id = data["page_state"]["page_attributes"].get("order_id")
    print(f"4. Pay: {data['page_state']['page_subtype']}, order_id: {order_id}")


if __name__ == "__main__":
    test_collect_with_order()
