from fastapi import Header, HTTPException

import os

# This function expects Next.js to send 'X-User-ID' AND a valid 'X-Internal-Api-Key'
# If either is missing or invalid, it rejects the request.
async def get_current_user_id(
    x_user_id: str = Header(...),
    x_internal_api_key: str = Header(...)
):
    expected_key = os.getenv("INTERNAL_API_KEY")
    
    if not expected_key:
        # Fail safe: if env var is missing, block everything
        raise HTTPException(status_code=500, detail="Server misconfiguration: INTERNAL_API_KEY missing")

    if x_internal_api_key != expected_key:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")

    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header missing")
        
    return x_user_id
