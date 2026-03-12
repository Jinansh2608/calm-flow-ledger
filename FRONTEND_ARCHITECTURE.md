# Frontend Architecture: Calm Flow Ledger

## 1. Overview
The Calm Flow Ledger frontend is a modern, high-performance financial management dashboard built with **React**, **TypeScript**, and **Vite**. It leverages a component-driven architecture with a strong emphasis on type safety, modularity, and rapid data manipulation through editable grids.

## 2. Tech Stack
- **Framework:** React 18 (Functional Components, Hooks)
- **Language:** TypeScript (Strict typing for financial data)
- **Build Tool:** Vite (Optimized HMR and production builds)
- **Styling:** Tailwind CSS + Shadcn/ui (Radix UI primitives)
- **State Management:** 
  - **Server State:** TanStack Query (React Query) for caching and synchronization
  - **Local State:** React Context API (`AuthContext`, `DashboardContext`)
- **Forms:** React Hook Form + Zod (Schema-based validation)
- **Routing:** React Router DOM (v6)

## 3. Directory Structure (`/src`)
The project follows a feature-based and layer-based hybrid organization:

- `components/`: Modular UI elements
  - `ui/`: Atom-level components (buttons, inputs, etc., mostly from Shadcn)
  - `dashboard/`: Feature-specific components (tables, drawers, modals)
- `contexts/`: Global state providers (Auth, Dashboard settings)
- `hooks/`: Reusable logic (analytics, mobile detection, toast notifications)
- `services/`: API abstraction layer (Axios/Fetch wrappers)
- `pages/`: Route-level container components
- `config/`: Dynamic constants (API endpoints, column definitions)
- `types/`: Universal TypeScript interfaces and schemas

## 4. Key Architectural Patterns

### A. Context-Driven Dashboard
The `DashboardContext` acts as a central hub for the main quotation and ledger views. It manages:
- Current active filters and search queries.
- Selected clients or projects.
- UI states (drawer visibility, modal triggers).

### B. Service Layer Abstraction
Instead of calling APIs directly in components, the app uses a dedicated `services/` layer:
- `api.ts`: Base configuration and interceptors.
- `clientService.ts`, `poService.ts`, etc.: Specialized modules for business logic.
- `apiDiagnostics.ts`: Integrated health checking and error logging.

### C. Dynamic Column Configuration
To handle various financial views (Billing, PO, Vendor), the system uses `DynamicColumnConfig.ts`. This allows the UI to adapt based on JSON configurations (`cols.json`, `billing_po_cols.json`) without hardcoding table headers.

### D. Security & Routing
- **ProtectedRoute:** Wraps sensitive paths using `AuthContext`.
- **Auth.tsx:** Centralized login/registration logic.

## 5. Data Flow
1. **Trigger:** User interacts with `EditableGrid` or `FilterSidebar`.
2. **State Change:** `DashboardContext` updates local filters.
3. **Fetching:** `useQuery` (TanStack) detects dependency change and triggers a service call.
4. **Processing:** `apiHelpers.ts` normalizes backend response.
5. **Render:** Components re-render with fresh, cached data.

## 6. Performance Optimizations
- **Shadcn VAUL:** Used for efficient mobile drawers (`DetailDrawer.tsx`).
- **Conditional Imports:** Minimizing bundle size for heavy libraries like `XLSX`.
- **React Query Caching:** Reduces redundant network requests for stagnant data.

## 7. Configuration Files
- `tsconfig.json`: Strict TypeScript rules for high code quality.
- `tailwind.config.ts`: Customized theme for the finance-focused UI.
- `vite.config.ts`: SWC-based fast refresh and target optimization.
