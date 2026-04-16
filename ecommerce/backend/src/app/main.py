"""FastAPI application entry point."""

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import addresses, auth, cart, categories, orders, products, users
from app.core.limiter import limiter

app = FastAPI(
    title="E-commerce API",
    description="E-commerce backend API",
    version="1.0.0",
)

# Add rate limit middleware
app.add_middleware(SlowAPIMiddleware)

# Exception handler for rate limits
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Initialize limiter
app.state.limiter = limiter

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["cart"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(addresses.router, prefix="/api/v1/addresses", tags=["addresses"])


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
