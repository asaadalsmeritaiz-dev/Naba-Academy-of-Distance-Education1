-- ==========================================
-- Supabase Schema Migration: University LMS & Proctoring System
-- Generated: 2026-07-08
-- ==========================================

-- Clean up existing tables if any (ordered to satisfy foreign key constraints)
drop table if exists public.forum_replies cascade;
drop table if exists public.forum_posts cascade;
drop table if exists public.exam_attempts cascade;
drop table if exists public.questions cascade;
drop table if exists public.exams cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.lectures cascade;
drop table if exists public.courses cascade;
drop table if exists public.terms cascade;
drop table if exists public.users cascade;

-- ==========================================
-- 1. Database Tables Creation
-- ==========================================

-- 1. users Table (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  student_id text unique,
  major text,
  role text not null check (role in ('student', 'instructor', 'admin')),
  avatar_url text,
  email text unique not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 2. terms Table (Academic semesters)
create table public.terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 3. courses Table
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.terms(id) on delete cascade,
  instructor_id uuid not null references public.users(id) on delete restrict,
  title text not null,
  description text not null,
  credit_hours integer not null,
  thumbnail_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 4. lectures Table
create table public.lectures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  video_url text not null,
  transcript text,
  duration integer not null, -- duration in seconds
  "order" integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 5. enrollments Table (Student course registrations)
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress integer default 0 not null check (progress >= 0 and progress <= 100),
  enrolled_at timestamp with time zone default now() not null,
  grade text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (student_id, course_id)
);

-- 6. exams Table
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text not null,
  duration_minutes integer not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  requires_proctoring boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 7. questions Table
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  type text not null check (type in ('mcq', 'true_false', 'essay')),
  question_text text not null,
  options jsonb, -- For MCQ (e.g., ["A", "B", "C", "D"])
  correct_answer text not null,
  points integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 8. exam_attempts Table
create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  started_at timestamp with time zone default now() not null,
  submitted_at timestamp with time zone,
  score double precision,
  proctoring_video_url text,
  proctoring_snapshots jsonb, -- array of snapshot image URLs e.g. ["snapshot1.png", "snapshot2.png"]
  snapshot_timestamps jsonb, -- timestamps for each snapshot e.g. ["00:01:23", "00:05:10"]
  proctoring_notes jsonb, -- AI-generated violation alerts and logs
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 9. forum_posts Table
create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 10. forum_replies Table
create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- ==========================================
-- 2. Automatic Triggers & Helpers
-- ==========================================

-- Function to handle updated_at automation
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables
create trigger set_updated_at before update on public.users for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.terms for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.courses for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.lectures for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.enrollments for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.exams for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.questions for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.exam_attempts for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.forum_posts for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_updated_at before update on public.forum_replies for each row execute procedure public.set_current_timestamp_updated_at();

-- Trigger to automatically create a profile in the public users table when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'جامعي جديد'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. Row Level Security (RLS) Configuration
-- ==========================================

-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.terms enable row level security;
alter table public.courses enable row level security;
alter table public.lectures enable row level security;
alter table public.enrollments enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_replies enable row level security;

-- 3.1 public.users Policies
create policy "Users can view their own profile" 
  on public.users for select 
  using (auth.uid() = id);

create policy "Admins can view all profiles" 
  on public.users for select 
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Users can update their own profile fields" 
  on public.users for update 
  using (auth.uid() = id);

-- 3.2 public.terms Policies
create policy "All authenticated users can view terms" 
  on public.terms for select 
  using (auth.role() = 'authenticated');

create policy "Only admins can manage terms" 
  on public.terms for all 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- 3.3 public.courses Policies
create policy "Everyone authenticated can view courses" 
  on public.courses for select 
  using (auth.role() = 'authenticated');

create policy "Only instructors/admins can manage courses" 
  on public.courses for all 
  using (exists (select 1 from public.users where id = auth.uid() and role in ('instructor', 'admin')));

-- 3.4 public.enrollments Policies
create policy "Students can view their own enrollments" 
  on public.enrollments for select 
  using (student_id = auth.uid());

create policy "Instructors can view enrollments for their own courses" 
  on public.enrollments for select 
  using (exists (select 1 from public.courses where id = enrollments.course_id and instructor_id = auth.uid()));

create policy "Admins can manage all enrollments" 
  on public.enrollments for all 
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- 3.5 public.lectures Policies
create policy "Enrolled students and instructors can view lectures" 
  on public.lectures for select 
  using (
    exists (select 1 from public.enrollments where student_id = auth.uid() and course_id = lectures.course_id) or
    exists (select 1 from public.courses where id = lectures.course_id and instructor_id = auth.uid()) or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Instructors and admins can manage lectures" 
  on public.lectures for all 
  using (
    exists (select 1 from public.courses where id = lectures.course_id and instructor_id = auth.uid()) or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- 3.6 public.exams Policies
create policy "Students can view exams only during the allowed window" 
  on public.exams for select 
  using (
    (
      exists (select 1 from public.enrollments where student_id = auth.uid() and course_id = exams.course_id)
      and now() >= start_time 
      and now() <= end_time
    ) or
    exists (select 1 from public.courses where id = exams.course_id and instructor_id = auth.uid()) or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Instructors and admins can manage exams" 
  on public.exams for all 
  using (
    exists (select 1 from public.courses where id = exams.course_id and instructor_id = auth.uid()) or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- 3.7 public.questions Policies
create policy "Students can see questions if enrolled and exam is active" 
  on public.questions for select 
  using (
    exists (
      select 1 from public.enrollments e 
      join public.exams ex on ex.course_id = e.course_id 
      where e.student_id = auth.uid() 
        and ex.id = questions.exam_id 
        and now() >= ex.start_time 
        and now() <= ex.end_time
    ) or
    exists (
      select 1 from public.exams ex 
      join public.courses c on c.id = ex.course_id 
      where ex.id = questions.exam_id and c.instructor_id = auth.uid()
    ) or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Instructors and admins can manage questions" 
  on public.questions for all 
  using (
    exists (
      select 1 from public.exams ex 
      join public.courses c on c.id = ex.course_id 
      where ex.id = questions.exam_id and c.instructor_id = auth.uid()
    ) or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- 3.8 public.exam_attempts Policies
create policy "Students can view and manage their own exam attempts" 
  on public.exam_attempts for all 
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "Instructors can view attempts for their courses" 
  on public.exam_attempts for select 
  using (
    exists (
      select 1 from public.exams ex 
      join public.courses c on c.id = ex.course_id 
      where ex.id = exam_attempts.exam_id and c.instructor_id = auth.uid()
    ) or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- 3.9 public.forum_posts Policies
create policy "All authenticated users can read forum posts" 
  on public.forum_posts for select 
  using (auth.role() = 'authenticated');

create policy "Users can manage their own forum posts" 
  on public.forum_posts for all 
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- 3.10 public.forum_replies Policies
create policy "All authenticated users can read forum replies" 
  on public.forum_replies for select 
  using (auth.role() = 'authenticated');

create policy "Users can manage their own forum replies" 
  on public.forum_replies for all 
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ==========================================
-- 4. Supabase Storage Buckets Configuration
-- ==========================================

-- 1. Create Storage Buckets within public/private schemas via SQL helper API
insert into storage.buckets (id, name, public)
values 
  ('lecture-videos', 'lecture-videos', true),
  ('proctoring-recordings', 'proctoring-recordings', false),
  ('proctoring-videos', 'proctoring-videos', false),
  ('proctoring-snapshots', 'proctoring-snapshots', false),
  ('assignments', 'assignments', false)
on conflict (id) do nothing;

-- 2. Storage Policies for 'lecture-videos'
create policy "Allow enrolled students and instructors to read lecture videos"
  on storage.objects for select
  using (
    bucket_id = 'lecture-videos' and (
      auth.role() = 'authenticated'
    )
  );

create policy "Allow instructors and admins to upload lecture videos"
  on storage.objects for insert
  with check (
    bucket_id = 'lecture-videos' and (
      exists (select 1 from public.users where id = auth.uid() and role in ('instructor', 'admin'))
    )
  );

-- 3. Storage Policies for 'proctoring-recordings' & 'proctoring-videos'
create policy "Allow students to upload proctoring video recordings"
  on storage.objects for insert
  with check (
    bucket_id in ('proctoring-recordings', 'proctoring-videos', 'proctoring-snapshots') and (
      auth.role() = 'authenticated'
    )
  );

create policy "Allow instructors and admins to review proctoring recordings"
  on storage.objects for select
  using (
    bucket_id in ('proctoring-recordings', 'proctoring-videos', 'proctoring-snapshots') and (
      exists (select 1 from public.users where id = auth.uid() and role in ('instructor', 'admin'))
    )
  );

-- 4. Storage Policies for 'assignments'
create policy "Allow authenticated users to upload assignments"
  on storage.objects for insert
  with check (
    bucket_id = 'assignments' and (
      auth.role() = 'authenticated'
    )
  );

create policy "Allow owner, instructors, and admins to download assignments"
  on storage.objects for select
  using (
    bucket_id = 'assignments' and (
      owner = auth.uid() or
      exists (select 1 from public.users where id = auth.uid() and role in ('instructor', 'admin'))
    )
  );
