# Barangay Pass

> On-chain barangay event registration built on Stellar + Soroban. Residents register with their Freighter wallet. Barangay staff verify in seconds — checking both the database and the blockchain simultaneously.

---

## Live Demo

Deploy to Vercel and connect your Supabase project to run live.

**Contract on Stellar Testnet**
```
CBOC6QEUR7C7TAJUJQTI4VPS3RSGNOL5JBM3VVNFSUBYOVHAMXGT3XNP
```
[View on Stellar Expert →](https://stellar.expert/explorer/testnet/contract/CBOC6QEUR7C7TAJUJQTI4VPS3RSGNOL5JBM3VVNFSUBYOVHAMXGT3XNP)

---

## What It Does

Barangay Pass replaces paper lists, manual spreadsheets, and screenshot-based attendance tracking with a wallet-linked, blockchain-verified registration system.

- Barangay staff create events with a registration fee and slot limit
- Residents connect their Freighter wallet and register in under a minute
- The Soroban smart contract records every registration on-chain — tamper-proof
- Staff verify attendance instantly by checking both the database and the blockchain

---

## Problem

A barangay secretary in Parañaque manually collects names, payment slips, and attendance lists for barangay basketball leagues, livelihood seminars, and community events — causing duplicate registrations, missing records, and delays that force residents to wait hours on event day.

## Solution

Barangay Pass creates an on-chain registration system where residents register through a web app, fees or deposits are paid through Stellar, and a Soroban smart contract records a tamper-proof registration linked to the resident's wallet for fast barangay-side verification.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Blockchain | Stellar Testnet + Soroban smart contracts |
| Wallet | Freighter browser extension |
| Deployment | Vercel |

---

## Project Structure

```
barangay-pass/
├── contracts/
│   └── barangay_pass/
│       ├── src/
│       │   ├── lib.rs        # Soroban smart contract
│       │   └── test.rs       # Contract tests
│       └── Cargo.toml
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Home page
│   │   ├── events/page.tsx               # Browse events
│   │   ├── register/page.tsx             # Resident registration flow
│   │   ├── verify/page.tsx               # Staff verification
│   │   ├── dashboard/page.tsx            # Staff dashboard
│   │   ├── create-event/page.tsx         # Create event (staff)
│   │   └── api/
│   │       ├── build-register-tx/        # Build Soroban transaction
│   │       ├── save-registration/        # Submit + save to DB
│   │       ├── verify-registration/      # Check DB + on-chain
│   │       └── create-event/             # Create event on-chain
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── stellar.ts        # Soroban helpers
│   │   ├── supabase.ts       # DB client
│   │   └── useFreighter.ts   # Freighter wallet hook
│   └── types/index.ts
├── supabase-schema.sql       # Run in Supabase SQL editor
├── supabase-rpc.sql          # Run after schema
└── Cargo.toml                # Soroban workspace
```

---

## Smart Contract

The Soroban contract is written in Rust and deployed on Stellar Testnet.

### Functions

| Function | Args | Description |
|---|---|---|
| `init` | `admin: Address` | Initialize contract with admin wallet — call once after deploy |
| `create_event` | `event_id: u32, fee: i128` | Staff creates event with registration fee in stroops |
| `register_resident` | `event_id: u32, resident: Address, payment_amount: i128` | Resident registers — requires wallet signature |
| `verify_registration` | `event_id: u32, resident: Address → bool` | Check if resident is registered |
| `get_event_fee` | `event_id: u32 → i128` | Return configured fee for an event |

### Registration Flow

```
Staff → create_event (server-side signed) → Soroban contract + Supabase
Resident → connect Freighter → select event → sign tx → Soroban + Supabase
Staff → verify → checks Supabase + on-chain simultaneously
```

---

## Setup

### Prerequisites

- Node.js 18+
- Freighter wallet browser extension (v5+)
- Supabase account (free tier works)
- Stellar Testnet keypair (generate at laboratory.stellar.org)

### 1. Clone and install

```bash
git clone https://github.com/jelobarasi23-a11y/barangay-pass
cd barangay-pass
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase-schema.sql`
3. Then run `supabase-rpc.sql`
4. Copy your Project URL and keys from **Settings → API**

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_CONTRACT_ID=CBOC6QEUR7C7TAJUJQTI4VPS3RSGNOL5JBM3VVNFSUBYOVHAMXGT3XNP

STAFF_STELLAR_SECRET=S...your-staff-secret-key
```

### 4. Initialize the contract

After deploying, call `init()` once to set the admin wallet:

```bash
node init.js
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo to Vercel and add all environment variables under **Project → Settings → Environment Variables**.

Mark `SUPABASE_SERVICE_ROLE_KEY` and `STAFF_STELLAR_SECRET` as **Server only** — never expose these to the browser.

---

## Freighter Setup for Testing

1. Install [Freighter](https://www.freighter.app/) browser extension (v5+)
2. Switch to **Testnet**: Freighter → Settings → Network → Test SDF Network
3. Fund your wallet with free XLM from [Stellar Friendbot](https://friendbot.stellar.org/?addr=YOUR_ADDRESS)
4. Connect your wallet on the site and register for an event

---

## Stellar Features Used

- **Soroban smart contracts** — registration logic, duplicate prevention, on-chain verification
- **Freighter wallet** — resident transaction signing via browser extension
- **Stellar Testnet** — zero-cost development and demo environment
- **XLM** — registration fees paid natively through the contract

---

## Target Users

- Barangay residents in Parañaque, Las Piñas, and Muntinlupa
- Barangay secretaries and staff
- SK officers
- Local community event organizers

---

## Why Stellar

Barangay Pass is a strong Stellar hackathon project because it solves a real local coordination problem involving both money movement and attendance verification. It demonstrates Stellar payment flow and Soroban coordination logic together in a single practical application — and it can be shown in a live demo in under two minutes.

---

Built for the Stellar Hackathon 2026 · Philippines 🇵🇭