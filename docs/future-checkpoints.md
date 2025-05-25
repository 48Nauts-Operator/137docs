# Future Checkpoints & Constraints

> Living document – record of non-functional requirements, edge-case considerations, and "don't forget" items that surfaced during planning sessions.  Update as the product evolves.

## Folder-Selection / Storage Refactor

1. **Maximum path length**  
   • Guard against OS limits (Windows ≤260 chars unless long-path enabled, macOS/Linux ≈4 k). Validate length on save.
2. **Cross-platform path compatibility**  
   • Normalise to POSIX style internally; display OS-native paths in UI.  
   • Escape/quote back-slashes for Windows CLI operations.
3. **Container volume boundaries**  
   • Validate that chosen paths reside inside mounts exposed to the backend container; warn otherwise.
4. **Network / removable drives**  
   • Detect and surface unmounted network shares; pause watcher gracefully until path is available again.
5. **Concurrent watcher reloads**  
   • Debounce rapid successive path changes to avoid race conditions.
6. **Transactional migration**  
   • Copy → verify checksum → atomically switch DB pointer; keep old data until verification succeeds.
7. **Rollback mechanism**  
   • If migration task errors, revert `storage_root` to previous value; keep partial copy for manual inspection.
8. **Performance for large archives**  
   • Chunked copy with progress reporting; consider rsync when available.
9. **Security**  
   • Prevent path traversal – user can only select directories they own / have permission for.
10. **Audit trail**  
    • Log every path change (old → new) with user & timestamp for compliance.

---
Owner: dev team
Created: 2025-05-22 