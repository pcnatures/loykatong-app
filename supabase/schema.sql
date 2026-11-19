-- ─────────────────────────────────────────────────────────────
--  ลอยกระทงออนไลน์ · Supabase schema
--  วิธีใช้: Supabase Dashboard → SQL Editor → New query → วางทั้งไฟล์ → Run
-- ─────────────────────────────────────────────────────────────

create table if not exists public.krathongs (
  id          uuid primary key,
  room_id     text not null check (room_id ~ '^[a-zA-Z0-9_-]{1,64}$'),
  client_id   text not null default '' check (char_length(client_id) <= 64),
  name        text not null check (char_length(name) between 1 and 30),
  wish        text not null default '' check (char_length(wish) <= 150),
  avatar      jsonb not null default '{}'::jsonb,
  krathong    jsonb not null default '{}'::jsonb,
  seed        real not null check (seed between 0 and 1),
  lane        real not null check (lane between 0 and 1),
  start_x     real not null check (start_x between 0 and 1),
  start_d     real not null check (start_d between 0 and 0.5),
  created_at  timestamptz not null default now()
);

create index if not exists krathongs_room_created_idx
  on public.krathongs (room_id, created_at desc);

-- ── Row Level Security: ทุกคนอ่านได้ / ลอยกระทงใหม่ได้ / แก้ไขหรือลบไม่ได้ ──
alter table public.krathongs enable row level security;

drop policy if exists "read krathongs" on public.krathongs;
create policy "read krathongs"
  on public.krathongs for select
  to anon, authenticated
  using (true);

drop policy if exists "float a krathong" on public.krathongs;
create policy "float a krathong"
  on public.krathongs for insert
  to anon, authenticated
  with check (
    created_at between now() - interval '1 minute' and now() + interval '1 minute'
    and pg_column_size(avatar) < 1024
    and pg_column_size(krathong) < 512
  );

-- ── สิทธิ์ระดับตาราง: RLS ด้านบนจะมีผลก็ต่อเมื่อ role มีสิทธิ์ GRANT ก่อน ──
--    (บางโปรเจกต์ไม่ให้สิทธิ์ anon กับตารางใหม่อัตโนมัติ → จะเจอ 42501 permission denied)
--    ให้แค่ select + insert เท่านั้น ไม่ให้ update / delete
grant usage on schema public to anon, authenticated;
grant select, insert on table public.krathongs to anon, authenticated;

-- ── กันสแปมฝั่งเซิร์ฟเวอร์ ─────────────────────────────────────
--    ช่วงพัก 8 วินาทีในแอปเลี่ยงได้ถ้ายิง API ตรง จึงจำกัดซ้ำในฐานข้อมูล:
--      • ต่อเครื่อง (client_id) : 1 ใบ / 5 วินาที
--      • ต่อ IP                : 20 ใบ / นาที  (เผื่อหลายคนใช้ Wi-Fi เดียวกันในงาน)
--      • ต่อห้อง               : 120 ใบ / นาที (กันห้องถูกถล่มจากหลาย IP)
--    เกินแล้วได้ error code PT429 (HTTP 429) → แอปแสดงข้อความให้รอสักครู่
--    ปรับตัวเลขได้ที่ส่วน "ปรับได้" ในฟังก์ชัน แล้วรันส่วนนี้ใหม่
--    คำหยาบไม่ต้องกรองซ้ำที่นี่: แอปกรองตอนแสดงผลทุกครั้งอยู่แล้ว (src/realtime/schema.js)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.krathong_rate_log (
  created_at  timestamptz not null default now(),
  ip_hash     text,          -- md5 ของ IP (ไม่เก็บ IP ตรง ๆ)
  client_id   text not null,
  room_id     text not null
);
create index if not exists krathong_rate_log_ip_idx      on private.krathong_rate_log (ip_hash, created_at);
create index if not exists krathong_rate_log_client_idx  on private.krathong_rate_log (client_id, created_at);
create index if not exists krathong_rate_log_created_idx on private.krathong_rate_log (created_at);
revoke all on private.krathong_rate_log from public, anon, authenticated;

create or replace function private.krathongs_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- ── ปรับได้ ──
  per_client_window constant interval := interval '5 seconds';
  per_client_max    constant int      := 1;
  per_ip_window     constant interval := interval '1 minute';
  per_ip_max        constant int      := 20;
  per_room_window   constant interval := interval '1 minute';
  per_room_max      constant int      := 120;
  -- ─────────────
  headers json;
  ip      text;
  ip_h    text;
begin
  -- ใช้เวลาของเซิร์ฟเวอร์เสมอ (กันการปลอม created_at)
  new.created_at := now();

  headers := nullif(current_setting('request.headers', true), '')::json;
  ip := coalesce(
    nullif(trim(headers ->> 'cf-connecting-ip'), ''),
    nullif(trim(split_part(headers ->> 'x-forwarded-for', ',', 1)), '')
  );
  ip_h := case when ip is null then null else md5(ip) end;

  -- ล็อกตามลำดับเดิมเสมอ เพื่อให้คำขอที่ยิงพร้อมกันต้องต่อคิว ไม่หลุดการนับ
  perform pg_advisory_xact_lock(7101, hashtext(new.client_id));
  if ip_h is not null then
    perform pg_advisory_xact_lock(7102, hashtext(ip_h));
  end if;
  perform pg_advisory_xact_lock(7103, hashtext(new.room_id));

  if (select count(*) from private.krathong_rate_log l
      where l.client_id = new.client_id and l.created_at > now() - per_client_window) >= per_client_max then
    raise exception using errcode = 'PT429', message = 'rate_limited', detail = 'client';
  end if;

  if ip_h is not null and (select count(*) from private.krathong_rate_log l
      where l.ip_hash = ip_h and l.created_at > now() - per_ip_window) >= per_ip_max then
    raise exception using errcode = 'PT429', message = 'rate_limited', detail = 'ip';
  end if;

  if (select count(*) from public.krathongs k
      where k.room_id = new.room_id and k.created_at > now() - per_room_window) >= per_room_max then
    raise exception using errcode = 'PT429', message = 'rate_limited', detail = 'room';
  end if;

  insert into private.krathong_rate_log (ip_hash, client_id, room_id)
  values (ip_h, new.client_id, new.room_id);

  -- ล้าง log เก่าเป็นครั้งคราว (ราว 1 ใน 50 ครั้ง)
  if random() < 0.02 then
    delete from private.krathong_rate_log where created_at < now() - interval '1 hour';
  end if;

  return new;
end;
$$;

revoke all on function private.krathongs_guard() from public, anon, authenticated;

drop trigger if exists krathongs_guard on public.krathongs;
create trigger krathongs_guard
  before insert on public.krathongs
  for each row execute function private.krathongs_guard();

-- ── เปิด Realtime ให้ตารางนี้ (ใช้ postgres_changes) ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'krathongs'
  ) then
    alter publication supabase_realtime add table public.krathongs;
  end if;
end $$;

-- ── (ไม่บังคับ) ลบกระทงเก่าอัตโนมัติทุกชั่วโมง ต้องเปิด extension pg_cron ก่อน ──
-- select cron.schedule('cleanup-krathongs', '0 * * * *',
--   $$ delete from public.krathongs where created_at < now() - interval '1 day' $$);

-- ── ตรวจผล (ต้องเป็นคำสั่งสุดท้ายของไฟล์) ──
--    รันทั้งไฟล์สำเร็จ → ตาราง Results แสดง 1 แถว:
--      triggers = krathongs_guard:O   log_table = private.krathong_rate_log
--    ถ้าขึ้นแค่ "Success. No rows returned" แปลว่าวางไฟล์เวอร์ชันเก่า
select
  (select string_agg(tgname || ':' || tgenabled::text, ', ')
     from pg_trigger
    where tgrelid = 'public.krathongs'::regclass and not tgisinternal) as triggers,
  to_regclass('private.krathong_rate_log') as log_table;
