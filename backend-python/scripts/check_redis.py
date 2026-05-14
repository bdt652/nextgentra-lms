#!/usr/bin/env python
"""Test Redis connection."""

import asyncio
import sys

import redis


async def test_redis_connection():
    """Test Redis connection and basic operations."""
    # Set UTF-8 encoding for Windows console
    if sys.platform == "win32":
        import io

        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

    redis_url = "redis://localhost:6379"

    try:
        # Create Redis connection (synchronous)
        r = redis.from_url(redis_url, decode_responses=True, socket_timeout=5)

        # Test ping (run in thread to avoid blocking)
        pong = await asyncio.to_thread(r.ping)
        if pong:
            print("[OK] Redis connection successful - PONG")
        else:
            print("[ERROR] Redis ping failed")
            return

        # Test basic operations
        test_key = "test:lms:connection"
        test_value = "hello_world"

        # Set a key
        await asyncio.to_thread(r.set, test_key, test_value, 60)
        print(f"[OK] SET {test_key} = {test_value}")

        # Get the key
        retrieved = await asyncio.to_thread(r.get, test_key)
        if retrieved == test_value:
            print(f"[OK] GET {test_key} = {retrieved}")
        else:
            print(f"[ERROR] GET {test_key} returned unexpected value: {retrieved}")

        # Delete the key
        await asyncio.to_thread(r.delete, test_key)
        print(f"[OK] DEL {test_key}")

        # Get Redis info
        info = await asyncio.to_thread(r.info)
        print("\n📊 Redis Information:")
        print(f"   Version: {info.get('redis_version', 'unknown')}")
        print(f"   Mode: {info.get('redis_mode', 'unknown')}")
        print(f"   Connected Clients: {info.get('connected_clients', 0)}")
        print(f"   Used Memory: {info.get('used_memory_human', 'unknown')}")

        # Close connection
        r.close()

        print("\n✅ All Redis checks passed!")

    except Exception as e:
        print(f"[ERROR] Redis connection test failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(test_redis_connection())
