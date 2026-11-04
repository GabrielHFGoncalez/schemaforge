# ⚡ SchemaForge Studio

> **High-Performance Database Schema Converter & Zero-Knowledge AI Prompt Sanitizer.**  
> 100% Client-Side. Zero Server Storage. Zero Telemetry. Complete Privacy.

🌐 **Live Web App:** [https://gabrielhfgoncalez.github.io/schemaforge/](https://gabrielhfgoncalez.github.io/schemaforge/)

---

## 💡 Why SchemaForge Studio?

Modern developers frequently face two major friction points:
1. **Schema Migration Drag:** Converting models between SQL DDL (`CREATE TABLE`), **Prisma ORM** (`schema.prisma`), **Drizzle ORM** (`pgTable`), and **TypeScript** interfaces takes valuable hours of manual transcription.
2. **AI Data Leaks:** Pasting production database dumps, customer table records, and API logs into public AI chats (ChatGPT, Claude, Gemini) violates corporate security policies, GDPR, and LGPD by exposing passwords, bcrypt hashes, API secrets, emails, CPFs, and credit cards.

**SchemaForge Studio** solves both with an ultra-fast, client-side web application.

---

## ✨ Features

### 1. 🔄 Multi-Engine Schema Converter
- **Supported Inputs & Outputs:**
  - Standard SQL DDL (PostgreSQL, MySQL, SQLite)
  - Prisma Schema (`model User { ... }`)
  - Drizzle ORM (`export const users = pgTable(...)`)
  - TypeScript Interfaces (`export interface User { ... }`)
  - JSON Schema (Draft-07)
- Instant live parsing and bi-directional conversion.
- 1-click presets for E-Commerce, SaaS Auth, and Social Content architectures.
- 1-click clipboard copy and file downloads (`.sql`, `.prisma`, `.ts`, `.json`).

### 2. 🛡️ Zero-Knowledge AI Prompt Sanitizer
- **What it redacts automatically:**
  - **Passwords & Hashes:** bcrypt (`$2a$12$...`), argon2, md5, hex tokens, and inline config passwords.
  - **API Keys & Secrets:** Stripe secret keys (`sk_live_...`), GitHub personal access tokens (`ghp_...`), AWS Access Keys (`AKIA...`), JWT tokens (`eyJ...`), and Bearer headers.
  - **Personal Identifiable Information (PII):** Emails, Brazilian CPF & CNPJ, International & Brazilian phone numbers, and Credit Card numbers (Visa, Mastercard, Amex, etc.).
  - **Network details:** Public IPv4 addresses.
- **Redaction Modes:**
  - **Descriptive Placeholders:** `[REDACTED_EMAIL_1]`, `[REDACTED_PASSWORD]`, `[REDACTED_CPF]`
  - **Realistic Synthetic Mocking (Faker):** Generates believable fake data so LLMs maintain context and reasoning capability.
  - **Consistent Pseudonymization:** Deterministic hashing preserves foreign keys and SQL `JOIN` consistency across tables.

### 3. 🔒 100% In-Browser Privacy
- Runs purely on vanilla modern JavaScript in your browser.
- No backend server. No cookies. No analytics or tracking scripts.
- Works offline and as a local utility.

---

## 🚀 Recommended Developer Stacks

Looking to host your database for free with high performance?
- **[Supabase](https://supabase.com)** — Open-source Firebase alternative with PostgreSQL, Auth, and Edge Functions.
- **[Neon Database](https://neon.tech)** — Serverless PostgreSQL with instantaneous git-like branching.
- **[Fly.io](https://fly.io)** — Deploy full-stack apps and micro-VMs globally close to your users.

---

## ☕ Support the Developer

SchemaForge Studio is free, open-source software built by **Gabriel Gonçalez** ([@GabrielHFGoncalez](https://github.com/GabrielHFGoncalez)).

If this tool saved you time or protected your team from an AI data leak:
- **Pix (Brasil):** Chave aleatória `99f7b8c7-6dcc-494a-ab2f-fa39c51f4bcd` (Beneficiário: GABRIEL, São Paulo)
- **GitHub Sponsors:** [sponsor @GabrielHFGoncalez](https://github.com/sponsors/GabrielHFGoncalez)

---

## 📄 License

MIT License — Feel free to use, modify, and distribute for personal and commercial projects.
