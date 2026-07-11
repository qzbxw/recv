## 2025-03-05 - Fix timing attack vulnerability in validInternalToken

**Vulnerability:** A timing attack vulnerability existed in `backend/internal/http/server.go` where `token == s.cfg.InternalToken` and string equality operators were used to compare cryptographic secret tokens, potentially leaking length and timing information.

**Learning:** It is crucial to use constant-time operations when validating authentication tokens or comparing cryptographic secrets. String equality operations (`==`) exit early upon finding a mismatch, which could be exploited in timing attacks to guess the secret.

**Prevention:** Use `subtle.ConstantTimeCompare` from the `crypto/subtle` standard library when validating any form of cryptographic tokens or sensitive values.
