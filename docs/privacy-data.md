# Data sent to the Inlay backend

This document describes data sent by `src/Unlocker.js` as of the current module version. The purposes below were verified against the current `inlay-backend` implementation. A field marked **backend troubleshooting** is not used to make an authorization or update decision.

## Request bodies

| Field | Sent to | Purpose |
| --- | --- | --- |
| `productId` | `POST /app/auth/start`; all authenticated access and completion requests | Identifies the product being activated or authorized. The backend verifies that an existing license matches it, looks up update information, and finds its subproducts. For expansion requests it identifies the expansion. |
| `deviceId` | All requests | The device identity from HISE. It binds activation and identity tokens to the device, is used for device-limit and license checks, and is stored with license usage. |
| `idToken` | `POST /app/auth/access`; `POST /app/sub-auth/access` | Authenticates the previously activated license and carries the bound device and company identity. |
| `activationToken` | `POST /app/auth/complete` | Identifies the pending browser activation and proves that the polling client is the device for which that activation was started. |
| `subproductId` | `POST /app/sub-auth/access` | Identifies the requested expansion so the backend can verify it belongs to the parent product and check or create its license. |
| `moduleVersion` | Authenticated access and completion requests | Used when creating an access token; the backend rejects module versions it does not support. It is also retained in license usage for **backend troubleshooting**. |
| `os` | Authenticated access and completion requests | Stored with license usage and shown in license/device views for **backend troubleshooting**. |
| `productVersion` | Authenticated access and completion requests | Used to decide whether a host product or expansion update is available. It is also retained in license usage for **backend troubleshooting**. |
| `productName` | Authenticated access and completion requests | **Backend troubleshooting.** |
| `isPlugin` | Authenticated access and completion requests | Stored with license usage and shown in license/device views for **backend troubleshooting**. |
| `subproducts[].id` | Host-product access and completion requests, when cached expansion access exists | Lets the backend identify installed expansions whose access state should be refreshed. |
| `subproducts[].version` | Host-product access and completion requests, when cached expansion access exists | Lets the backend issue an update URL and access response for the installed expansion version. |
| `instanceID` | Authenticated access and completion requests | **Backend troubleshooting.** |

## Transport-added body fields

`apiPost()` adds the following fields to every POST body. Despite their `X-` names, they are JSON body fields because of the HISE server API used by this module.

| Field | Purpose |
| --- | --- |
| `X-Inlay-Product-Id` | **Backend troubleshooting.** |
| `X-Inlay-Module-Version` | **Backend troubleshooting.** |
| `X-Inlay-Instance-Id` | **Backend troubleshooting.** |
| `_stub` | Serialization sentinel required to make HISE send the request as JSON. |
