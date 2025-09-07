# 📱 Mobile App Strategy

## Overview

This document outlines the architecture and goals for the two mobile apps:

- **US Immigration Help** (Law4Hire)
- **Cannlaw** (Cannlaw)

## Tech Stack

- React Native (Expo)
- Shared logic via monorepo
- API-first architecture

## Features

| App                  | Key Features                          |
|----------------------|----------------------------------------|
| US Immigration Help  | Intake forms, AI chat, onboarding      |
| Cannlaw              | Case dashboard, notifications, uploads |

## Design Goals

- Responsive UI across devices
- Offline-first for intake forms
- Secure local storage for sensitive data

## Next Steps

- Scaffold shared components
- Connect to mock API
- Begin TDD for intake and dashboard modules