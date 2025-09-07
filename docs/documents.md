# Documents & Uploads

_Last updated: 2025-08-31_

## Overview
Uploads are allowed only **after payment**. Files up to **25 MB**. Allowed: pdf, docx, doc, png, jpg/jpeg, tiff, gif, heic. HEIC is auto-converted for review convenience.

## AV Scanning (Gateway Pattern)
- **Presign** to a **quarantine bucket**; client uploads directly.
- AV worker scans, then the system **promotes** clean files to the clean bucket and attaches to the case.
- Infected files are rejected and purged.

## Form Automation
- Ingest **PDF AcroForm/tags** to create **FormTemplate** metadata.
- Use **FieldBindings** to reuse shared user data across multiple forms.
- Generate **FormInstance** PDFs from stored data and templates.

## API
- `POST /v1/uploads/presign`
- Scanner callback → `POST /v1/uploads/confirm`
- `POST /v1/forms/{template}/generate`

## Data Model
- **Upload**: caseId, status{pending|clean|infected}, size, mime, originalName, storageUrl, verdictAt.
- **FormTemplate**: visaTypeId, formCode, version, fields[].
- **FieldBinding**: formField ↔ dataKey.
- **FormInstance**: caseId, templateId, dataSnapshot, pdfUrl.
