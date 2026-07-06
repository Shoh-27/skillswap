# SkillSwap V2 — Full Stack

> Laravel + React | V1 + Session Booking + Rating/Reviews + Notifications + Advanced Search

---

## V2 da qo'shilgan yangi feature'lar

| Feature | Backend | Frontend |
|---|---|---|
| 📅 **Session Booking** | `sessions` jadvali, SessionService, 5 ta endpoint | SessionsPage: propose modal, confirm/cancel/done, vaqt tanlash |
| ⭐ **Rating & Review** | `reviews` jadvali, ReviewService, avg_rating keshlanadi | ReviewModal: 5-yulduz UI, SessionCard ichida "Leave Review" |
| 🔔 **Notifications** | 6 ta Notification sinfi, NotificationService, `notifications` jadvali | NotificationsDropdown: bell icon, real-time polling, mark as read |
| 🔍 **Advanced Search** | UserService yangilandi: skill_ids[], city, min_rating, sort | DiscoverPage: filter panel, aktiv teglar, multi-skill filter |

---

## Ishga tushirish

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
# .env → DB sozlamalari
php artisan migrate --seed
php artisan serve    # → localhost:8000

# Frontend (yangi terminal)
cd frontend
npm install
npm run dev          # → localhost:5173
```

---

## Yangi API Endpointlar

```
# Sessions
POST   /api/v1/connections/{connectionId}/sessions   ← taklif yuborish
GET    /api/v1/sessions?filter=upcoming|past|all
GET    /api/v1/sessions/{id}
PUT    /api/v1/sessions/{id}/confirm
PUT    /api/v1/sessions/{id}/cancel
PUT    /api/v1/sessions/{id}/done

# Reviews
POST   /api/v1/sessions/{sessionId}/reviews
GET    /api/v1/sessions/{sessionId}/reviews
GET    /api/v1/users/{userId}/reviews

# Notifications
GET    /api/v1/notifications?unread=1
GET    /api/v1/notifications/unread-count
PUT    /api/v1/notifications/{id}/read
PUT    /api/v1/notifications/read-all
DELETE /api/v1/notifications/{id}

# Advanced search (yangi parametrlar)
GET    /api/v1/users?search=&skill_ids[]=&type=&city=&min_rating=&sort=
```

---

## Session holatlari

```
proposed → confirmed → done
         ↓           ↓
      cancelled   (review yuboriladi)
```

---

## Bildirishnoma turlari

| Tur | Qachon | Kanal |
|---|---|---|
| `connection_request` | Kimdir connect qilganda | database + email |
| `connection_accepted` | Request qabul qilinganda | database + email |
| `session_proposed` | Sessiya taklif qilinganda | database + email |
| `session_confirmed` | Sessiya tasdiqlanganda | database + email |
| `review_reminder` | Sessiya "done" bo'lganda | database + email |
| `new_message` | Yangi xabar kelganda | database only |
