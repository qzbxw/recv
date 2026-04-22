# Official Routing Contour

## Domains
*   **Production:** `reqst.xyz`

## URLs

*   `/` — Public site (Landing page, marketing) -> `frontend-public`
*   `/app` — Cabinet (Seller dashboard, administration) -> `frontend`
*   `/checkout/:id` — Checkout page for buyers -> `frontend` (Note: based on current `nginx.dev.conf` legacy rules redirect to `/app/checkout`, but if it's meant to be official it should map correctly. We list it as an official route).
*   `/developers` — Developer documentation/portal -> mapped to `/app` per redirects currently, or `frontend-public` if migrated.
*   `/docs` — API Documentation -> `api` or `frontend-public`
*   `/blog` — Blog -> `frontend-public`
*   `/admin` — Administration -> mapped to `/app/admin` per redirects currently.

*Note: The NGINX configuration maps legacy short paths like `/admin`, `/checkout`, and `/developers` to `/app/...`.*
