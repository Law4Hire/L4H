# 📘 Project Plan: Law4Hire & Cannlaw Platform Rebuild

---

## 🧭 Overview

This document outlines the technical and strategic roadmap for rebuilding the Law4Hire and Cannlaw platforms, including their respective mobile applications. The goal is to create scalable, maintainable, and AI-integrated systems for legal services delivery and customer acquisition.

### Platform Roles

| Platform     | Role                                | Audience                      |
|--------------|--------------------------------------|-------------------------------|
| Law4Hire     | Customer acquisition & onboarding    | Immigration clients           |
| Cannlaw      | Legal services delivery              | Legal professionals & clients |

---

## 📱 Mobile Applications

| Mobile App           | Linked Platform | Purpose                          |
|----------------------|------------------|----------------------------------|
| US Immigration Help  | Law4Hire         | Intake, onboarding, funneling    |
| Cannlaw              | Cannlaw          | Case management, service delivery|

---

## 🛠️ Tech Stack

| Layer        | Technology                         |
|--------------|-------------------------------------|
| Backend      | .NET 10 (pre-release)               |
| Frontend     | React (web), React Native (mobile)  |
| Container    | Docker + Caddy                      |
| Database     | SQL Server                          |
| AI Services  | OpenAI / Azure OpenAI / Vertex AI   |

> Note: .NET 10 is being used intentionally to future-proof the platform and leverage upcoming SDK/runtime features.

---

## 🔍 Environment Strategy

- Standardized containers for dev, test, and prod
- Parity across web and mobile environments
- Responsive design and accessibility baked in
- TDD-first approach for all new modules
- Legacy Blazor code audit in progress (extracting reusable logic)

---

## 🤖 AI Integration Strategy

- Modular API-based integration for fast iteration
- Evaluation matrix for local vs cloud-hosted LLMs
- Automated ticketing and documentation for accountability
- Scenario modeling to determine best-fit AI service per use case

---

## 📂 Project Modules

| Module               | Status         | Notes                                      |
|----------------------|----------------|--------------------------------------------|
| Intake & Onboarding  | In planning    | AI-assisted form logic                     |
| Case Management      | Legacy audit   | Migrating reusable Blazor logic            |
| Document Automation  | Pending        | AI + template engine integration           |
| Mobile Sync Layer    | In design      | Shared logic across React Native apps      |
| AI Orchestration     | In evaluation  | DialogFlow CX vs Azure OpenAI vs Vertex AI |

---

## 🧠 Naming Glossary

| Term                  | Definition                                      |
|-----------------------|--------------------------------------------------|
| Law4Hire              | Web platform for client acquisition              |
| US Immigration Help   | Mobile app for Law4Hire                         |
| Cannlaw               | Web platform for legal services                 |
| Cannlaw (Mobile)      | Mobile app for Cannlaw                          |

---

## 📌 Next Steps

- Finalize .NET 10 project scaffolding
- Complete legacy code audit and extraction
- Define AI integration scenarios and fallback logic
- Begin TDD implementation for intake and case modules
- Draft onboarding docs for new contributors

---

_Last updated: August 29, 2025_
