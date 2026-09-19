"""Vercel serverless entry point for Megh-Drishti FastAPI backend.

Vercel's Python runtime requires a file at the root of the deployed directory
that exports a WSGI/ASGI-compatible `app` object.  We simply re-export the
fully-configured FastAPI application from `app.main`.

Environment variables expected by Vercel:
  DEMO_MODE=true   (set in Vercel project settings or vercel.json env block)
"""

from app.main import app  # noqa: F401 – re-exported for Vercel runtime

__all__ = ["app"]
