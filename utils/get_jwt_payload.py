import base64
import json


def get_jwt_payload(auth_token):
    try:
        token_parts = auth_token.split(".")
        encoded_payload = token_parts[1]
        decoded_payload = base64.urlsafe_b64decode(
            encoded_payload + "=" * (4 - len(encoded_payload) % 4)
        )
        payload_str = decoded_payload.decode("utf-8")
        payload = json.loads(payload_str)
        return payload
    except Exception as e:
        print(f"Error decoding JWT payload: {e}")
        return None
