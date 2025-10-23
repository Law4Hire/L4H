# Translation Management Guide

This guide covers the comprehensive translation management utilities available for the L4H platform. These tools help manage translations across all applications (L4H, Cannlaw, shared-ui) with support for 22 languages.

## Overview

The translation management system provides utilities for:

- **Language Management**: Adding and removing languages
- **Translation Updates**: Updating shared translations across applications
- **Key Migration**: Migrating translation keys and updating code references
- **Validation**: Comprehensive validation of translation completeness and quality
- **Synchronization**: Keeping translations synchronized across applications

## Available Tools

### 1. Translation Manager (Recommended)

The comprehensive tool that combines all functionality:

```bash
node web/shared-ui/src/scripts/translation-manager.ts <command> [options]
```

#### Commands

**Add a new language:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts add-language zh-TW
```

**Remove a language:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts remove-language zh-TW
```

**Update translation key:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts update common loading "Loading..."
```

**Migrate translation key:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts migrate old.key new.key common
```

**Synchronize namespaces:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts sync common,errors
```

**Validate all translations:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts validate
```

**Generate comprehensive report:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts report translation-report.json
```

**List supported languages:**
```bash
node web/shared-ui/src/scripts/translation-manager.ts list-languages
```

#### Global Options

- `--no-backup`: Disable automatic backups
- `--no-validate`: Skip validation after operations
- `--workspace <path>`: Set workspace root path

### 2. Individual Utilities

#### Add New Language

```bash
node web/shared-ui/src/scripts/add-new-language.ts <command> [options]
```

**Commands:**
- `add <language-code>`: Add a new language
- `remove <language-code>`: Remove a language
- `list`: List supported languages

**Options:**
- `--no-copy`: Don't copy from base language
- `--placeholders`: Generate placeholder translations
- `--no-config`: Don't update configuration files

**Examples:**
```bash
# Add Chinese Traditional with placeholders
node web/shared-ui/src/scripts/add-new-language.ts add zh-TW --placeholders

# Remove a language
node web/shared-ui/src/scripts/add-new-language.ts remove zh-TW

# List all supported languages
node web/shared-ui/src/scripts/add-new-language.ts list
```

#### Update Shared Translations

```bash
node web/shared-ui/src/scripts/update-shared-translations.ts <command> [options]
```

**Commands:**
- `update <namespace> <key> <value>`: Update a single key
- `delete <namespace> <key>`: Delete a key
- `sync <namespace>`: Synchronize namespace
- `bulk <file>`: Bulk update from file
- `template <file>`: Generate update template

**Examples:**
```bash
# Update a translation key
node web/shared-ui/src/scripts/update-shared-translations.ts update common loading "Loading..."

# Delete a translation key
node web/shared-ui/src/scripts/update-shared-translations.ts delete common oldKey

# Synchronize a namespace
node web/shared-ui/src/scripts/update-shared-translations.ts sync common

# Bulk update from JSON file
node web/shared-ui/src/scripts/update-shared-translations.ts bulk updates.json
```

#### Translation Key Migrator

```bash
node web/shared-ui/src/scripts/translation-key-migrator.ts <command> [options]
```

**Commands:**
- `migrate <oldKey> <newKey> [namespace]`: Migrate a single key
- `bulk <file>`: Bulk migrate from file
- `analyze <key>`: Analyze key usage
- `template <file>`: Generate migration template

**Options:**
- `--preserve`: Preserve old key
- `--apps <app1,app2>`: Target specific applications
- `--target-namespace <namespace>`: Target different namespace

**Examples:**
```bash
# Migrate a single key
node web/shared-ui/src/scripts/translation-key-migrator.ts migrate old.key new.key common

# Analyze key usage
node web/shared-ui/src/scripts/translation-key-migrator.ts analyze common.loading

# Bulk migrate from file
node web/shared-ui/src/scripts/translation-key-migrator.ts bulk migrations.json
```

#### Translation Validation

```bash
node web/shared-ui/src/scripts/run-translation-validation.ts [options]
```

**Options:**
- `--language <code>`: Validate specific language
- `--namespace <name>`: Validate specific namespace
- `--fix-missing`: Attempt to fix missing keys

**Examples:**
```bash
# Validate all translations
node web/shared-ui/src/scripts/run-translation-validation.ts

# Validate specific language
node web/shared-ui/src/scripts/run-translation-validation.ts --language es-ES

# Validate specific namespace
node web/shared-ui/src/scripts/run-translation-validation.ts --namespace common
```

## File Formats

### Bulk Update Format (updates.json)

```json
[
  {
    "key": "example.newKey",
    "value": "New translation value",
    "namespace": "common",
    "action": "add"
  },
  {
    "key": "example.existingKey",
    "value": "Updated translation value",
    "namespace": "common",
    "action": "update"
  },
  {
    "key": "example.oldKey",
    "value": "",
    "namespace": "common",
    "action": "delete"
  }
]
```

### Migration Format (migrations.json)

```json
[
  {
    "oldKey": "old.translation.key",
    "newKey": "new.translation.key",
    "namespace": "common",
    "targetNamespace": "common",
    "applications": ["shared-ui", "l4h"],
    "preserveOld": false
  },
  {
    "oldKey": "another.old.key",
    "newKey": "another.new.key",
    "namespace": "errors",
    "targetNamespace": "forms",
    "applications": ["l4h"],
    "preserveOld": true
  }
]
```

## Supported Languages

The system supports 22 languages:

| Code  | Language    | Native Name     | RTL | Region        |
|-------|-------------|-----------------|-----|---------------|
| ar-SA | Arabic      | العربية         | Yes | Saudi Arabia  |
| bn-BD | Bengali     | বাংলা           | No  | Bangladesh    |
| de-DE | German      | Deutsch         | No  | Germany       |
| en-US | English     | English         | No  | United States |
| es-ES | Spanish     | Español         | No  | Spain         |
| fr-FR | French      | Français        | No  | France        |
| hi-IN | Hindi       | हिन्दी          | No  | India         |
| id-ID | Indonesian  | Bahasa Indonesia| No  | Indonesia     |
| it-IT | Italian     | Italiano        | No  | Italy         |
| ja-JP | Japanese    | 日本語          | No  | Japan         |
| ko-KR | Korean      | 한국어          | No  | South Korea   |
| mr-IN | Marathi     | मराठी           | No  | India         |
| pl-PL | Polish      | Polski          | No  | Poland        |
| pt-BR | Portuguese  | Português       | No  | Brazil        |
| ru-RU | Russian     | Русский         | No  | Russia        |
| ta-IN | Tamil       | தமிழ்           | No  | India         |
| te-IN | Telugu      | తెలుగు          | No  | India         |
| tl-PH | Filipino    | Filipino        | No  | Philippines   |
| tr-TR | Turkish     | Türkçe          | No  | Turkey        |
| ur-PK | Urdu        | اردو            | Yes | Pakistan      |
| vi-VN | Vietnamese  | Tiếng Việt      | No  | Vietnam       |
| zh-CN | Chinese     | 中文            | No  | China         |

## Application Structure

### Shared UI (web/shared-ui/public/locales/shared/)
- `common.json`: Shared UI elements, buttons, navigation
- `errors.json`: Error messages, validation
- `forms.json`: Form labels, placeholders, validation
- `auth.json`: Authentication flows

### L4H Application (web/l4h/public/locales/l4h/)
- `interview.json`: Interview-specific content
- `dashboard.json`: L4H dashboard content
- `visa-library.json`: Visa information
- `pricing.json`: Pricing and packages

### Cannlaw Application (web/cannlaw/public/locales/cannlaw/)
- `legal.json`: Legal terminology
- `billing.json`: Billing and time tracking
- `clients.json`: Client management
- `cases.json`: Case management

## Best Practices

### 1. Translation Key Naming

Use hierarchical naming with dots:
```
app.section.component.element
```

Examples:
- `common.buttons.save`
- `errors.validation.required`
- `interview.questions.purpose.title`

### 2. Adding New Languages

1. Use the translation manager for comprehensive setup:
   ```bash
   node web/shared-ui/src/scripts/translation-manager.ts add-language zh-TW
   ```

2. Review generated files and replace placeholders with actual translations

3. Validate the new language:
   ```bash
   node web/shared-ui/src/scripts/translation-manager.ts validate
   ```

### 3. Updating Translations

1. Always create backups (enabled by default)
2. Use the translation manager for consistency
3. Validate after updates
4. Test in the applications

### 4. Key Migration

1. Analyze key usage before migration:
   ```bash
   node web/shared-ui/src/scripts/translation-key-migrator.ts analyze old.key
   ```

2. Use bulk migration for multiple keys
3. Test thoroughly after migration

### 5. Regular Maintenance

1. Run validation regularly:
   ```bash
   node web/shared-ui/src/scripts/translation-manager.ts validate
   ```

2. Generate reports for tracking:
   ```bash
   node web/shared-ui/src/scripts/translation-manager.ts report
   ```

3. Synchronize namespaces when base language changes:
   ```bash
   node web/shared-ui/src/scripts/translation-manager.ts sync
   ```

## Troubleshooting

### Common Issues

1. **Missing translation files**: Use `add-language` to create missing files
2. **Inconsistent structure**: Use `sync` command to fix structure
3. **Missing keys**: Use validation to identify and fix missing keys
4. **Code references not updated**: Use key migrator to update code files

### Error Recovery

1. **Backup restoration**: Backups are created in `translation-backups/` directory
2. **Validation errors**: Use validation tools to identify and fix issues
3. **Structural problems**: Use synchronization to fix structure issues

### Performance Considerations

1. **Large operations**: Use bulk operations for multiple changes
2. **Validation**: Run validation after major changes
3. **Backups**: Backups are created automatically but can be disabled with `--no-backup`

## Integration with Development Workflow

### Pre-commit Hooks

Add translation validation to pre-commit hooks:

```bash
# In .git/hooks/pre-commit
node web/shared-ui/src/scripts/translation-manager.ts validate --no-backup
```

### CI/CD Integration

Add translation validation to CI pipeline:

```yaml
# In .github/workflows/ci.yml
- name: Validate Translations
  run: node web/shared-ui/src/scripts/translation-manager.ts validate --no-backup
```

### Development Scripts

Add to package.json:

```json
{
  "scripts": {
    "translations:validate": "node web/shared-ui/src/scripts/translation-manager.ts validate",
    "translations:report": "node web/shared-ui/src/scripts/translation-manager.ts report",
    "translations:sync": "node web/shared-ui/src/scripts/translation-manager.ts sync"
  }
}
```

## Support and Maintenance

### Regular Tasks

1. **Weekly**: Run validation and generate reports
2. **Monthly**: Review incomplete translations and update
3. **Quarterly**: Review and update translation management tools

### Monitoring

1. Use validation reports to track translation health
2. Monitor missing key reports
3. Track completion percentages by language

### Updates

1. Keep translation management tools updated
2. Review and update supported languages list
3. Update documentation as needed

## Advanced Usage

### Custom Validation Rules

Extend validation by modifying validation scripts to include:
- Cultural appropriateness checks
- Technical term consistency
- Brand terminology compliance

### Automated Translation

Integrate with translation services:
- Google Translate API for initial translations
- Professional translation service APIs
- Translation memory systems

### Analytics Integration

Track translation usage:
- Language usage statistics
- Missing translation frequency
- User language preferences

This comprehensive guide should help you effectively manage translations across the L4H platform. For specific issues or advanced use cases, refer to the individual utility documentation or create custom scripts based on the provided utilities.