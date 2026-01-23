# Law4Hire / Project Rules

<git_workflow>
- **Pre-flight**: ALWAYS run `git pull` before starting a new task.
- **Branching**: Create a feature branch for every task (e.g., `feature/description` or `fix/description`).
- **Version Control**: Maintain strict SemVer. Update `.csproj` (Version/AssemblyVersion) and `package.json` simultaneously when bumping versions.
</git_workflow>

<build_and_test>
- **Environment**: ALWAYS use PowerShell. Do not use bash/sh.
- **Verification**: Before any check-in, you must successfully execute:
  1. `dotnet build` (ensure 0 errors)
  2. `npm run build` (within the React directory)
- **Deployment**: Remember that SSH access is available for the main server to verify logs in `/var/log/...` or relevant application paths.
</build_and_test>

<tech_stack_context>
- **Backend**: .NET 9.0 API.
- **Frontend**: React / React Native.
- **Style**: Prefer asynchronous patterns (async/await) and C# Reflection where architecturally appropriate.
</tech_stack_context>