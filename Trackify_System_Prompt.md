# System Specification: Trackify

**Project Name:** Trackify  
**Core Framework:** Next.js 15 (App Router) + Supabase + Tailwind CSS  
**UI/UX Aesthetic:** Minimalist Corporate-Tech (Dual Blue color scheme, utilizing Shadcn UI)

---

## 1. Module: Unified Task Engine
A high-performance management system leveraging **Supabase Realtime** for instant updates across Kanban and List views.

### Functional Requirements:
* **Customizable Workflows:** Users define specific 'Workflows' (e.g., Marketing, Engineering) containing unique 'Steps'.
* **Synchronized Dual-Views:**
    * **Kanban View:** Visual drag-and-drop board powered by `@dnd-kit` or `hello-pangea/dnd`.
    * **List View:** High-density data table using **TanStack Table** for advanced filtering, sorting, and server-side pagination.
* **Task Entity Schema (Supabase Postgres):**
    * **Attributes:** Title, Markdown Description (rendered via `react-markdown`), Threaded Comments.
    * **Urgency Levels:** Categorical hierarchy (Critical, High, Medium, Low) with visual indicators.
    * **Audit Trail:** Database-level triggers logging status transitions, timestamps, and `auth.uid()` for every task modification.

---

## 2. Module: Investor-Grade Budget Center
A transparent fiscal planning tool utilizing **Postgres Functions** and **RLS (Row Level Security)** to ensure data integrity and restricted access.

### Functional Requirements:
* **Fiscal Architecture:**
    * **Multi-Dimensional Allocation:** Comparative tracking of 'Planned' vs. 'Actual' expenditure.
    * **Double-Entry Ledger:** Managed via Postgres Transactions to ensure real-time calculation of balances across departmental accounts.
* **Investor Dashboard:**
    * **Read-Only Metrics:** Restricted via Supabase RLS policies, showing high-level liquidity and burn rates.
    * **Visual Reporting:** Interactive charts powered by **Recharts** or **Tremor**, detailing allocation by category (e.g., R&D, Operations).
* **Forecasting & Strategy:**
    * **Runway Modeling:** Client-side simulations to project future financial health based on revenue inputs.
    * **Fiscal Locking:** A `locked` boolean in the `budgets` table, enforced by database constraints to prevent modification after approval.

---

## 3. Technical Implementation Details
* **Framework:** **Next.js 15** for optimized Server Components and SEO.
* **Database & Auth:** **Supabase**. Use Supabase Auth for identity and **Row Level Security (RLS)** for fine-grained access control (replacing the need for Spatie).
* **UI Components:** **Shadcn UI** for a consistent, accessible minimalist aesthetic.
* **Real-time:** **Supabase Realtime** for "toast" notifications on task movements and threshold breaches.
* **Deployment:** **Vercel** for seamless CI/CD and Edge Function support.

---

## 4. Development Roadmap
1.  **Phase 1:** Supabase Schema Design (Migrations) & Auth Setup with RLS Policies.
2.  **Phase 2:** Workflow Engine & Task CRUD using Next.js Server Actions.
3.  **Phase 3:** Real-time Kanban & List View Implementation.
4.  **Phase 4:** Financial Ledger Logic (Postgres Functions) & Investor Dashboard Analytics.