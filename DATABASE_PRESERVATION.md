# Database Preservation Policy

## Critical Database Preservation Rules

**NEVER DELETE OR RECREATE THE DATABASE** except in extreme circumstances where no other solution exists.

### Guidelines:
- The database should remain stable and constant across development sessions
- Only apply incremental changes through EF Core migrations
- Preserve all existing data and schema modifications
- Always attempt data-preserving solutions before considering database recreation

### When Database Deletion is Acceptable:
1. Corrupted database that cannot be repaired
2. Major schema changes that cannot be handled by migrations
3. Explicit user request to reset the database
4. Complete development environment reset requested by the user

### Preferred Solutions:
- Use `dotnet ef migrations add` for schema changes
- Use `dotnet ef database update` to apply migrations
- Use database repair commands for corruption issues
- Use selective data cleanup rather than full database drops

This policy ensures development continuity and prevents accidental data loss.