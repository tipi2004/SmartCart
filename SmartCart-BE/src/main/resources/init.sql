-- ============================================================

-- ECOMMERCE + CHATBOT + MARKETPLACE SCHEMA

-- Supabase Migration — chạy trong SQL Editor hoặc CLI

-- Thứ tự: Extensions → Tables → Indexes → RLS Policies

-- ============================================================



-- Enable UUID extension (Supabase đã bật sẵn, để an toàn)

create extension if not exists "uuid-ossp";

create extension if not exists "pg_trgm"; -- full-text search cho products/faq





-- ============================================================

-- 1. NGƯỜI DÙNG

-- ============================================================



create table public.users (

  id            uuid primary key default uuid_generate_v4(),

  full_name     text not null,

  email         text not null unique,

  phone         text,

  shipping_address text,

  password_hash text,                        -- null nếu dùng OAuth (Supabase Auth)

  role          text not null default 'customer'

                check (role in ('customer','seller','staff','admin')),

  is_active     boolean not null default true,

  created_at    timestamptz not null default now()

);

comment on table public.users is 'Tài khoản người dùng — đồng bộ với auth.users của Supabase';

-- Bảng lưu trữ mã OTP
create table if not exists public.otp_codes (
    id uuid primary key,
    identifier varchar(255) not null,
    code varchar(255) not null,
    channel varchar(50) not null,
    expires_at timestamp not null,
    is_used boolean not null default false
);

create table public.user_addresses (

  id             uuid primary key default uuid_generate_v4(),

  user_id        uuid not null references public.users(id) on delete cascade,

  recipient_name text not null,

  phone          text not null,

  address_line   text not null,

  ward           text,

  district       text,

  province       text not null,

  is_default     boolean not null default false,

  created_at     timestamptz not null default now()

);





-- ============================================================

-- 2. SHOP

-- ============================================================



create table public.shops (

  id           uuid primary key default uuid_generate_v4(),

  owner_id     uuid not null references public.users(id) on delete restrict,

  name         text not null,

  slug         text not null unique,

  description  text,

  avatar_url   text,

  cover_url    text,

  phone        text,

  email        text,

  address      text,

  status       text not null default 'pending'

               check (status in ('pending','active','suspended')),

  is_verified  boolean not null default false,

  avg_rating   numeric(3,2) default 0,       -- cached, cập nhật bằng trigger

  total_sales  integer default 0,            -- cached

  created_at   timestamptz not null default now()

);



create table public.shop_members (

  id          uuid primary key default uuid_generate_v4(),

  shop_id     uuid not null references public.shops(id) on delete cascade,

  user_id     uuid not null references public.users(id) on delete cascade,

  role        text not null default 'staff'

              check (role in ('owner','manager','staff')),

  permissions jsonb not null default '{}',

  joined_at   timestamptz not null default now(),

  unique (shop_id, user_id)

);



create table public.shop_followers (

  shop_id     uuid not null references public.shops(id) on delete cascade,

  user_id     uuid not null references public.users(id) on delete cascade,

  followed_at timestamptz not null default now(),

  primary key (shop_id, user_id)

);



create table public.shop_reviews (

  id          uuid primary key default uuid_generate_v4(),

  shop_id     uuid not null references public.shops(id) on delete cascade,

  user_id     uuid not null references public.users(id) on delete set null,

  order_id    uuid,                          -- FK thêm sau khi tạo orders

  rating      smallint not null check (rating between 1 and 5),

  comment     text,

  shop_reply  text,

  replied_at  timestamptz,

  created_at  timestamptz not null default now()

);





-- ============================================================

-- 3. DANH MỤC & SẢN PHẨM

-- ============================================================



create table public.categories (

  id            uuid primary key default uuid_generate_v4(),

  parent_id     uuid references public.categories(id) on delete set null,

  name          text not null,

  slug          text not null unique,

  image_url     text,

  display_order integer not null default 0

);



create table public.products (

  id            uuid primary key default uuid_generate_v4(),

  shop_id       uuid not null references public.shops(id) on delete cascade,

  category_id   uuid references public.categories(id) on delete set null,

  name          text not null,

  slug          text not null,

  description   text,

  base_price    numeric(18,2) not null check (base_price >= 0),

  is_active     boolean not null default true,

  approval_status text not null default 'approved',

  rejection_reason text,

  created_at    timestamptz not null default now(),

  unique (shop_id, slug)

);



create table public.product_variants (

  id          uuid primary key default uuid_generate_v4(),

  product_id  uuid not null references public.products(id) on delete cascade,

  sku         text not null unique,

  color       text,

  size        text,

  price       numeric(18,2) not null check (price >= 0),

  stock_qty   integer not null default 0 check (stock_qty >= 0),

  image_url   text

);



create table public.product_images (

  id            uuid primary key default uuid_generate_v4(),

  product_id    uuid not null references public.products(id) on delete cascade,

  image_url     text not null,

  is_main       boolean not null default false,

  display_order integer not null default 0

);



create table public.reviews (

  id            uuid primary key default uuid_generate_v4(),

  product_id    uuid not null references public.products(id) on delete cascade,

  user_id       uuid references public.users(id) on delete set null,

  order_item_id uuid,                        -- FK thêm sau khi tạo order_items

  rating        smallint not null check (rating between 1 and 5),

  comment       text,

  created_at    timestamptz not null default now()

);



create table public.product_comments (

  id          uuid primary key default uuid_generate_v4(),

  product_id  uuid not null references public.products(id) on delete cascade,

  user_id     uuid references public.users(id) on delete set null,

  parent_id   uuid references public.product_comments(id) on delete cascade,

  content     text not null,

  like_count  integer not null default 0,

  is_hidden   boolean not null default false,

  created_at  timestamptz not null default now()

);



create table public.comment_likes (

  comment_id  uuid not null references public.product_comments(id) on delete cascade,

  user_id     uuid not null references public.users(id) on delete cascade,

  created_at  timestamptz not null default now(),

  primary key (comment_id, user_id)

);





-- ============================================================

-- 4. KHUYẾN MÃI, GIỎ HÀNG & ĐƠN HÀNG

-- ============================================================



create table public.promotions (

  id               uuid primary key default uuid_generate_v4(),

  shop_id          uuid references public.shops(id) on delete cascade, -- null = platform

  code             text not null unique,

  type             text not null check (type in ('percent','fixed')),

  value            numeric(18,2) not null check (value > 0),

  min_order_value  numeric(18,2) not null default 0,

  max_uses         integer,

  used_count       integer not null default 0,

  starts_at        timestamptz not null,

  ends_at          timestamptz not null,

  is_active        boolean not null default true,

  check (ends_at > starts_at)

);



create table public.cart (

  id         uuid primary key default uuid_generate_v4(),

  user_id    uuid references public.users(id) on delete cascade,

  session_id text,                           -- khách vãng lai

  created_at timestamptz not null default now(),

  check (user_id is not null or session_id is not null)

);



create table public.cart_items (

  id         uuid primary key default uuid_generate_v4(),

  cart_id    uuid not null references public.carts(id) on delete cascade,

  product_id uuid not null references public.products(id) on delete cascade,

  variant_id uuid references public.product_variants(id) on delete set null,

  quantity   integer not null default 1 check (quantity > 0),

  unique (cart_id, product_id)

);



create table public.orders (

  id               uuid primary key default uuid_generate_v4(),

  shop_id          uuid references public.shops(id) on delete restrict,

  user_id          uuid references public.users(id) on delete set null,

  promotion_id     uuid references public.promotions(id) on delete set null,

  address_id       uuid references public.user_addresses(id) on delete set null,

  status           text not null default 'pending'

                   check (status in ('pending','confirmed','preparing','shipping','delivered','cancelled','refunded')),

  subtotal         numeric(18,2) not null default 0,

  discount_amount  numeric(18,2) not null default 0,

  shipping_fee     numeric(18,2) not null default 0,

  total_amount     numeric(18,2) not null,

  payment_method   text not null check (payment_method in ('cod','card','bank_transfer','qr','bnpl')),

  payment_status   text not null default 'pending'

                   check (payment_status in ('pending','processing','paid','failed','refunded')),

  payment_expires_at timestamptz,

  shipping_tracking text,

  shipping_address  text not null default 'Chua cap nhat',

  note             text,

  created_at       timestamptz not null default now()

);



create table public.order_items (

  id          uuid primary key default uuid_generate_v4(),

  order_id    uuid not null references public.orders(id) on delete cascade,

  variant_id  uuid references public.product_variants(id) on delete set null,

  quantity    integer not null check (quantity > 0),

  unit_price  numeric(18,2) not null default 0,        -- snapshot giá lúc mua

  total_price numeric(18,2) not null default 0

);



-- Thêm FK bị defer trước đó

alter table public.reviews      add constraint reviews_order_item_fk      foreign key (order_item_id) references public.order_items(id) on delete set null;

alter table public.shop_reviews add constraint shop_reviews_order_fk       foreign key (order_id)      references public.orders(id) on delete set null;





-- ============================================================

-- 5. THANH TOÁN

-- ============================================================



create table public.payments (

  id               uuid primary key default uuid_generate_v4(),

  order_id         uuid not null references public.orders(id) on delete cascade,

  amount           numeric(18,2) not null,

  currency         char(3) not null default 'VND',

  method           text not null check (method in ('cod','card','bank_transfer','qr','bnpl')),

  status           text not null default 'pending'

                   check (status in ('pending','processing','success','failed','cancelled')),

  detail_type      text check (detail_type in ('cash','card','bank','qr','bnpl')),

  detail_id        uuid,

  gateway_txn_id   text,

  gateway_response jsonb,

  redirect_url     text,

  paid_at          timestamptz,

  created_at       timestamptz not null default now()

);



create table public.payment_cash (

  id              uuid primary key default uuid_generate_v4(),

  received_amount numeric(18,2) not null,

  change_amount   numeric(18,2) not null default 0,

  received_by     uuid references public.users(id) on delete set null,

  received_at     timestamptz not null default now()

);



create table public.payment_card (

  id               uuid primary key default uuid_generate_v4(),

  card_brand       text,

  last4            char(4),

  cardholder_name  text,

  gateway          text,

  gateway_txn_id   text,

  auth_code        text,

  installment_months smallint

);



create table public.payment_bank_transfer (

  id              uuid primary key default uuid_generate_v4(),

  bank_name       text not null,

  account_number  text not null,

  account_name    text not null,

  transfer_ref    text,

  transferred_at  timestamptz,

  proof_image_url text,

  verified_by     uuid references public.users(id) on delete set null,

  verified_at     timestamptz

);



create table public.payment_qr (

  id              uuid primary key default uuid_generate_v4(),

  provider        text not null,

  qr_code         text,

  qr_expires_at   timestamptz not null,

  gateway_txn_id  text,

  scanned_at      timestamptz,

  confirmed_at    timestamptz

);



create table public.payment_bnpl (

  id                  uuid primary key default uuid_generate_v4(),

  provider            text not null,

  loan_id             text,

  total_installments  smallint not null,

  installment_amount  numeric(18,2) not null,

  interest_rate       numeric(5,4) not null default 0,

  approved_at         timestamptz,

  due_date            date not null

);



create table public.bnpl_installment_schedule (

  id              uuid primary key default uuid_generate_v4(),

  bnpl_id         uuid not null references public.payment_bnpl(id) on delete cascade,

  installment_no  smallint not null,

  due_date        date not null,

  amount          numeric(18,2) not null,

  status          text not null default 'pending'

                  check (status in ('pending','paid','overdue')),

  paid_at         timestamptz

);



create table public.payment_logs (

  id          uuid primary key default uuid_generate_v4(),

  payment_id  uuid not null references public.payments(id) on delete cascade,

  event_type  text not null,

  raw_payload jsonb,

  ip_address  inet,

  is_verified boolean not null default false,

  created_at  timestamptz not null default now()

);



create table public.refunds (

  id             uuid primary key default uuid_generate_v4(),

  payment_id     uuid not null references public.payments(id) on delete restrict,

  order_id       uuid not null references public.orders(id) on delete restrict,

  amount         numeric(18,2) not null check (amount > 0),

  reason         text,

  status         text not null default 'pending'

                 check (status in ('pending','processing','completed','rejected')),

  refund_txn_id  text,

  requested_at   timestamptz not null default now(),

  processed_at   timestamptz

);





-- ============================================================

-- 6. CHAT SHOP ↔ NGƯỜI DÙNG

-- ============================================================



create table public.shop_conversations (

  id                 uuid primary key default uuid_generate_v4(),

  shop_id            uuid not null references public.shops(id) on delete cascade,

  user_id            uuid not null references public.users(id) on delete cascade,

  last_message_at    timestamptz,

  user_unread_count  integer not null default 0,

  shop_unread_count  integer not null default 0,

  status             text not null default 'active' check (status in ('active','archived')),

  created_at         timestamptz not null default now(),

  unique (shop_id, user_id)

);



create table public.shop_messages (

  id              uuid primary key default uuid_generate_v4(),

  conversation_id uuid not null references public.shop_conversations(id) on delete cascade,

  sender_id       uuid not null references public.users(id) on delete cascade,

  sender_type     text not null check (sender_type in ('user','shop')),

  type            text not null default 'text'

                  check (type in ('text','image','product','order')),

  content         text,

  attachments     jsonb,

  ref_product_id  uuid references public.products(id) on delete set null,

  ref_order_id    uuid references public.orders(id) on delete set null,

  is_read         boolean not null default false,

  sent_at         timestamptz not null default now()

);





-- ============================================================

-- 7. CHATBOT

-- ============================================================



create table public.chatbot_sessions (

  id            uuid primary key default uuid_generate_v4(),

  user_id       uuid references public.users(id) on delete set null,

  session_token text not null unique,

  channel       text not null default 'web' check (channel in ('web','mobile','api')),

  started_at    timestamptz not null default now(),

  ended_at      timestamptz

);



create table public.chatbot_messages (

  id           uuid primary key default uuid_generate_v4(),

  session_id   uuid not null references public.chatbot_sessions(id) on delete cascade,

  sender       text not null check (sender in ('user','bot')),

  content      text not null,

  intent       text,

  confidence   real,

  entities     jsonb,

  sent_at      timestamptz not null default now()

);



create table public.faq (

  id          uuid primary key default uuid_generate_v4(),

  category_id uuid references public.categories(id) on delete set null,

  question    text not null,

  answer      text not null,

  keywords    jsonb not null default '[]',

  priority    integer not null default 0,

  is_active   boolean not null default true,

  created_at  timestamptz not null default now()

);





-- ============================================================

-- 8. LIVESTREAM

-- ============================================================



create table public.livestreams (

  id            uuid primary key default uuid_generate_v4(),

  shop_id       uuid not null references public.shops(id) on delete cascade,

  host_id       uuid not null references public.users(id) on delete restrict,

  title         text not null,

  thumbnail_url text,

  stream_key    text unique,

  playback_url  text,

  status        text not null default 'scheduled'

                check (status in ('scheduled','live','ended')),

  scheduled_at  timestamptz,

  started_at    timestamptz,

  ended_at      timestamptz,

  peak_viewers  integer not null default 0,

  total_orders  integer not null default 0,

  replay_url    text,

  created_at    timestamptz not null default now()

);



create table public.livestream_products (

  id             uuid primary key default uuid_generate_v4(),

  livestream_id  uuid not null references public.livestreams(id) on delete cascade,

  product_id     uuid not null references public.products(id) on delete cascade,

  flash_price    numeric(18,2),

  flash_stock    integer,

  display_order  integer not null default 0,

  pinned_at      timestamptz,

  is_active      boolean not null default true,

  unique (livestream_id, product_id)

);



create table public.livestream_comments (

  id            uuid primary key default uuid_generate_v4(),

  livestream_id uuid not null references public.livestreams(id) on delete cascade,

  user_id       uuid references public.users(id) on delete set null,

  type          text not null default 'comment'

                check (type in ('comment','like','join','order')),

  content       text,

  sent_at       timestamptz not null default now()

);



create table public.livestream_viewers (

  id            uuid primary key default uuid_generate_v4(),

  livestream_id uuid not null references public.livestreams(id) on delete cascade,

  user_id       uuid references public.users(id) on delete set null,

  session_id    text,

  joined_at     timestamptz not null default now(),

  left_at       timestamptz

);





-- ============================================================

-- 9. INDEXES

-- ============================================================



-- Users

create index on public.users (email);

create index on public.users (role);



-- Products

create index on public.products (shop_id);

create index on public.products (category_id);

create index on public.products (is_active);

create index on public.products using gin (to_tsvector('simple', name)); -- full-text search

create index on public.product_variants (product_id);

create index on public.product_variants (sku);



-- Orders

create index on public.orders (user_id);

create index on public.orders (shop_id);

create index on public.orders (status);

create index on public.orders (payment_status);

create index on public.orders (created_at desc);



-- Payments

create index on public.payments (order_id);

create index on public.payments (status);

create index on public.payment_logs (payment_id);

create index on public.payment_logs (created_at desc);



-- Chat

create index on public.shop_conversations (shop_id);

create index on public.shop_conversations (user_id);

create index on public.shop_messages (conversation_id);

create index on public.shop_messages (sent_at desc);



-- Livestream

create index on public.livestreams (shop_id);

create index on public.livestreams (status);

create index on public.livestream_comments (livestream_id);

create index on public.livestream_comments (sent_at desc);



-- Chatbot

create index on public.chatbot_sessions (user_id);

create index on public.chatbot_messages (session_id);



-- FAQ full-text

create index on public.faq using gin (to_tsvector('simple', question || ' ' || answer));





-- ============================================================

-- 10. ROW LEVEL SECURITY (RLS)

-- ============================================================

-- Bật RLS cho các bảng nhạy cảm



alter table public.users              enable row level security;

alter table public.user_addresses     enable row level security;

alter table public.orders             enable row level security;

alter table public.order_items        enable row level security;

alter table public.payments           enable row level security;

alter table public.refunds            enable row level security;

alter table public.cart               enable row level security;

alter table public.cart_items         enable row level security;

alter table public.shop_messages      enable row level security;

alter table public.shop_conversations enable row level security;

alter table public.chatbot_sessions   enable row level security;

alter table public.chatbot_messages   enable row level security;

alter table public.payment_logs       enable row level security;



-- Users: chỉ đọc được profile của chính mình

-- create policy "users: self read"   on public.users for select using (auth.uid() = id);

-- create policy "users: self update" on public.users for update using (auth.uid() = id);



-- -- Addresses: chỉ owner được thao tác

-- create policy "addresses: owner"   on public.user_addresses for all using (auth.uid() = user_id);



-- -- Cart: chỉ owner

-- create policy "cart: owner"        on public.cart for all using (auth.uid() = user_id);

-- create policy "cart_items: owner"  on public.cart_items for all

--   using (exists (select 1 from public.cart where id = cart_id and user_id = auth.uid()));



-- -- Orders: buyer hoặc shop member

-- create policy "orders: buyer read" on public.orders for select

--   using (auth.uid() = user_id);

-- create policy "orders: shop read"  on public.orders for select

--   using (exists (

--     select 1 from public.shop_members

--     where shop_id = orders.shop_id and user_id = auth.uid()

--   ));



-- -- Payments: chỉ buyer của order đó

-- create policy "payments: buyer read" on public.payments for select

--   using (exists (

--     select 1 from public.orders

--     where id = payments.order_id and user_id = auth.uid()

--   ));



-- -- Chat: chỉ 2 bên trong cuộc trò chuyện

-- create policy "conversations: participant" on public.shop_conversations for all

--   using (

--     auth.uid() = user_id or

--     exists (select 1 from public.shop_members where shop_id = shop_conversations.shop_id and user_id = auth.uid())

--   );

-- create policy "messages: participant" on public.shop_messages for all

--   using (exists (

--     select 1 from public.shop_conversations sc

--     where sc.id = conversation_id

--     and (sc.user_id = auth.uid() or

--          exists (select 1 from public.shop_members sm where sm.shop_id = sc.shop_id and sm.user_id = auth.uid()))

--   ));



-- -- Chatbot: chỉ chính mình

-- create policy "chatbot_sessions: owner"  on public.chatbot_sessions for all using (auth.uid() = user_id);

-- create policy "chatbot_messages: owner"  on public.chatbot_messages for select

--   using (exists (select 1 from public.chatbot_sessions where id = session_id and user_id = auth.uid()));



-- -- Payment logs: chỉ admin (service_role) được đọc

-- create policy "payment_logs: service only" on public.payment_logs for all using (false);





-- ============================================================

-- 11. TRIGGER — tự động cập nhật avg_rating của shop

-- ============================================================



-- create or replace function update_shop_avg_rating()

-- returns trigger language plpgsql security definer as $$

-- begin

--   update public.shops

--   set avg_rating = (

--     select round(avg(rating)::numeric, 2)

--     from public.shop_reviews

--     where shop_id = coalesce(new.shop_id, old.shop_id)

--   )

--   where id = coalesce(new.shop_id, old.shop_id);

--   return new;

-- end;

-- $$;



-- create trigger trg_shop_avg_rating

--   after insert or update or delete on public.shop_reviews

--   for each row execute function update_shop_avg_rating();






-- ============================================================

-- XONG! 33 bảng + indexes + RLS + trigger

-- ============================================================
