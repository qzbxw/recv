## 2024-06-28 - Timing Attack in Legacy Admin Login
**Vulnerability:** The legacy admin login implementation used standard string comparison for the username and returned immediately on mismatch before performing the password check.
**Learning:** Early returns on authentication checks create side-channel timing leaks. By measuring response times, an attacker can confirm valid usernames because requests with valid usernames take slightly longer (as they proceed to the password check).
**Prevention:** Always ensure that all authentication checks (both username and password) use constant time comparison functions like `subtle.ConstantTimeCompare`, and always evaluate both checks before deciding to return an error, keeping the response time uniform regardless of which input was invalid.
