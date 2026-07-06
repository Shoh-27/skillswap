# SkillSwap Frontend

> React + Vite + TailwindCSS — Premium UI for the SkillSwap REST API

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (proxies /api → localhost:8000)
npm run dev

# 3. Open http://localhost:5173
```

Make sure your Laravel backend is running on `http://localhost:8000`.

---

## Folder Structure

```
src/
├── components/
│   ├── ui/
│   │   └── index.jsx          # All reusable primitives:
│   │                          #   Button, Input, Textarea, Select
│   │                          #   Card, Badge, SkillTag, Avatar
│   │                          #   Tabs, EmptyState, Spinner, ToastContainer
│   └── UserCard.jsx           # Discover page user card with connect action
│
├── pages/
│   ├── LoginPage.jsx          # Auth — centered card, gradient bg
│   ├── RegisterPage.jsx       # Auth — registration form
│   ├── DashboardPage.jsx      # Home — hero, stats, skills, connections
│   ├── DiscoverPage.jsx       # Search + filter users grid
│   ├── ConnectionsPage.jsx    # Tabs: Received / Sent / Accepted
│   ├── ChatPage.jsx           # Sidebar + message bubbles + polling
│   └── ProfilePage.jsx        # Edit info + add/remove skills
│
├── services/
│   └── api.js                 # Axios instance + all API methods
│
├── hooks/
│   ├── useAuth.jsx            # Auth context + login/register/logout/refreshUser
│   └── useToast.js            # Toast notification hook
│
├── layouts/
│   ├── AppLayout.jsx          # Navbar + sidebar + mobile bottom nav
│   └── AuthLayout.jsx         # Gradient background wrapper
│
├── App.jsx                    # Router + AuthProvider + route guards
├── main.jsx                   # React root
└── index.css                  # Tailwind directives + global styles
```

---

## API Service Layer

All requests go through `src/services/api.js`.

```js
import { authApi, profileApi, skillsApi, usersApi, connectionsApi, messagesApi } from './services/api'

// Auth
authApi.register({ name, email, password, password_confirmation })
authApi.login({ email, password })
authApi.logout()
authApi.me()

// Profile
profileApi.update({ name, bio })
profileApi.addSkill(skillId, 'teach' | 'learn')
profileApi.removeSkill(userSkillId)

// Skills (public)
skillsApi.list()

// Discover
usersApi.discover({ skill_id?, type?, per_page?, page? })
usersApi.show(id)

// Connections
connectionsApi.list('sent' | 'received' | 'accepted' | '')
connectionsApi.send(receiverId)
connectionsApi.accept(connectionId)
connectionsApi.reject(connectionId)

// Chat
messagesApi.list(connectionId, { per_page?, page? })
messagesApi.send(connectionId, messageText)
```

---

## Pages Overview

| Page          | Route           | Description                                       |
|---------------|-----------------|---------------------------------------------------|
| Login         | `/login`        | Centered card, email/password, gradient background |
| Register      | `/register`     | Name, email, password + confirm                   |
| Dashboard     | `/dashboard`    | Hero section, stats, skills summary, connections  |
| Discover      | `/discover`     | User grid with skill/type filter + search         |
| Connections   | `/connections`  | Tabs: Received, Sent, Accepted; accept/reject     |
| Chat          | `/chat/:id`     | Contact sidebar + bubble chat, polls every 5s     |
| Profile       | `/profile`      | Edit name/bio, add/remove teach & learn skills    |

---

## Design System

### Colors
- **Primary:** Indigo (`#4f46e5`) → Violet (`#7c3aed`) gradient
- **Teach skills:** Emerald chips
- **Learn skills:** Indigo chips
- **Backgrounds:** `slate-50` page, `white` cards
- **Borders:** `slate-200` (1px)

### Typography
- **Body font:** DM Sans (Google Fonts)
- **Display:** Instrument Serif (for decorative headings)
- **Sizes:** xs=12px, sm=13px, base=15px, lg=17px, xl=22px

### Components (from `src/components/ui/index.jsx`)
```jsx
<Button variant="primary|secondary|ghost|danger|success|outline" size="sm|md|lg" loading>
<Input label error icon={LucideIcon} />
<Textarea label error />
<Card hover>
<Badge variant="indigo|violet|emerald|amber|rose|gray">
<SkillTag name type="teach|learn" onRemove={fn} />
<Avatar name size="xs|sm|md|lg|xl" />
<Tabs tabs={[]} active onChange />
<EmptyState icon title description action />
<Spinner size />
<ToastContainer toasts dismiss />
```

### Spacing
- 8px grid system via Tailwind
- Cards: `p-5` or `p-6`
- Page padding: `p-6 md:p-8`
- Grid gaps: `gap-4` or `gap-5`

---

## Auth Flow

1. Token stored in `localStorage` as `skillswap_token`
2. User object stored as `skillswap_user`
3. Axios interceptor attaches `Authorization: Bearer {token}` automatically
4. 401 responses → clear storage + redirect to `/login`
5. `useAuth()` hook exposes: `user`, `token`, `login()`, `register()`, `logout()`, `refreshUser()`

---

## Mobile Responsive

- Sidebar hidden on `< lg` screens
- Bottom tab bar shown on mobile
- Discover grid: 1 col → 2 col → 3 col
- Chat sidebar: hidden on mobile (show only chat window)
- Cards and forms stack vertically on small screens# SkillSwap Frontend

> React + Vite + TailwindCSS — Premium UI for the SkillSwap REST API

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (proxies /api → localhost:8000)
npm run dev

# 3. Open http://localhost:5173
```

Make sure your Laravel backend is running on `http://localhost:8000`.

---

## Folder Structure

```
src/
├── components/
│   ├── ui/
│   │   └── index.jsx          # All reusable primitives:
│   │                          #   Button, Input, Textarea, Select
│   │                          #   Card, Badge, SkillTag, Avatar
│   │                          #   Tabs, EmptyState, Spinner, ToastContainer
│   └── UserCard.jsx           # Discover page user card with connect action
│
├── pages/
│   ├── LoginPage.jsx          # Auth — centered card, gradient bg
│   ├── RegisterPage.jsx       # Auth — registration form
│   ├── DashboardPage.jsx      # Home — hero, stats, skills, connections
│   ├── DiscoverPage.jsx       # Search + filter users grid
│   ├── ConnectionsPage.jsx    # Tabs: Received / Sent / Accepted
│   ├── ChatPage.jsx           # Sidebar + message bubbles + polling
│   └── ProfilePage.jsx        # Edit info + add/remove skills
│
├── services/
│   └── api.js                 # Axios instance + all API methods
│
├── hooks/
│   ├── useAuth.jsx            # Auth context + login/register/logout/refreshUser
│   └── useToast.js            # Toast notification hook
│
├── layouts/
│   ├── AppLayout.jsx          # Navbar + sidebar + mobile bottom nav
│   └── AuthLayout.jsx         # Gradient background wrapper
│
├── App.jsx                    # Router + AuthProvider + route guards
├── main.jsx                   # React root
└── index.css                  # Tailwind directives + global styles
```

---

## API Service Layer

All requests go through `src/services/api.js`.

```js
import { authApi, profileApi, skillsApi, usersApi, connectionsApi, messagesApi } from './services/api'

// Auth
authApi.register({ name, email, password, password_confirmation })
authApi.login({ email, password })
authApi.logout()
authApi.me()

// Profile
profileApi.update({ name, bio })
profileApi.addSkill(skillId, 'teach' | 'learn')
profileApi.removeSkill(userSkillId)

// Skills (public)
skillsApi.list()

// Discover
usersApi.discover({ skill_id?, type?, per_page?, page? })
usersApi.show(id)

// Connections
connectionsApi.list('sent' | 'received' | 'accepted' | '')
connectionsApi.send(receiverId)
connectionsApi.accept(connectionId)
connectionsApi.reject(connectionId)

// Chat
messagesApi.list(connectionId, { per_page?, page? })
messagesApi.send(connectionId, messageText)
```

---

## Pages Overview

| Page          | Route           | Description                                       |
|---------------|-----------------|---------------------------------------------------|
| Login         | `/login`        | Centered card, email/password, gradient background |
| Register      | `/register`     | Name, email, password + confirm                   |
| Dashboard     | `/dashboard`    | Hero section, stats, skills summary, connections  |
| Discover      | `/discover`     | User grid with skill/type filter + search         |
| Connections   | `/connections`  | Tabs: Received, Sent, Accepted; accept/reject     |
| Chat          | `/chat/:id`     | Contact sidebar + bubble chat, polls every 5s     |
| Profile       | `/profile`      | Edit name/bio, add/remove teach & learn skills    |

---

## Design System

### Colors
- **Primary:** Indigo (`#4f46e5`) → Violet (`#7c3aed`) gradient
- **Teach skills:** Emerald chips
- **Learn skills:** Indigo chips
- **Backgrounds:** `slate-50` page, `white` cards
- **Borders:** `slate-200` (1px)

### Typography
- **Body font:** DM Sans (Google Fonts)
- **Display:** Instrument Serif (for decorative headings)
- **Sizes:** xs=12px, sm=13px, base=15px, lg=17px, xl=22px

### Components (from `src/components/ui/index.jsx`)
```jsx
<Button variant="primary|secondary|ghost|danger|success|outline" size="sm|md|lg" loading>
<Input label error icon={LucideIcon} />
<Textarea label error />
<Card hover>
<Badge variant="indigo|violet|emerald|amber|rose|gray">
<SkillTag name type="teach|learn" onRemove={fn} />
<Avatar name size="xs|sm|md|lg|xl" />
<Tabs tabs={[]} active onChange />
<EmptyState icon title description action />
<Spinner size />
<ToastContainer toasts dismiss />
```

### Spacing
- 8px grid system via Tailwind
- Cards: `p-5` or `p-6`
- Page padding: `p-6 md:p-8`
- Grid gaps: `gap-4` or `gap-5`

---

## Auth Flow

1. Token stored in `localStorage` as `skillswap_token`
2. User object stored as `skillswap_user`
3. Axios interceptor attaches `Authorization: Bearer {token}` automatically
4. 401 responses → clear storage + redirect to `/login`
5. `useAuth()` hook exposes: `user`, `token`, `login()`, `register()`, `logout()`, `refreshUser()`

---

## Mobile Responsive

- Sidebar hidden on `< lg` screens
- Bottom tab bar shown on mobile
- Discover grid: 1 col → 2 col → 3 col
- Chat sidebar: hidden on mobile (show only chat window)
- Cards and forms stack vertically on small screens

