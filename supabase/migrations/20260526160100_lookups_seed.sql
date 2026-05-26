-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0002 — Lookup seed data (Phase 1 §1, first slice)
--
-- Starter values for all 6 lookups. Trim or extend after review — these are
-- defensible starting points, not the final canon. ON CONFLICT DO NOTHING
-- on every insert so re-running the seed is safe.
--
-- - sub_communities: traditional Nagar sub-groups (Gujarati names per MEMORY)
-- - genres: exact 10-genre list from SPEC §2 (Setusarjan magazine)
-- - listing_categories: 9 categories with time_binding from SPEC §4 table
-- - cities: India hubs (Gujarati cities + metros) + diaspora hubs
--   (USA, UK, Gulf, East Africa, East Asia, Australia, Canada)
-- - professions: ~30 mainstream professional categories
-- - specialties: detailed for Doctor/Engineer/Software/Lawyer/CA/Teacher;
--   other professions start empty and grow via admin
-- ─────────────────────────────────────────────────────────────────────────────


-- sub_communities (Nagar sub-groups, Gujarati) ──────────────────────────────
insert into public.sub_communities (name) values
  ('વડનગરા'),
  ('વિસનગરા'),
  ('સાઠોદરા'),
  ('ચિત્રોદરા'),
  ('પ્રશ્નોરા'),
  ('કૃષ્ણાગર')
on conflict (name) do nothing;


-- genres (Setusarjan magazine, exact list from SPEC §2) ─────────────────────
insert into public.genres (name) values
  ('લેખ'),
  ('ચિંતન'),
  ('લઘુવાર્તા'),
  ('કવિતા'),
  ('ગઝલ'),
  ('ગીત'),
  ('અછાંદસ'),
  ('ગરબો'),
  ('બાળગીત'),
  ('હાસ્ય')
on conflict (name) do nothing;


-- listing_categories (with time_binding from SPEC §4) ───────────────────────
insert into public.listing_categories (name, time_binding) values
  ('business',  'always'),
  ('room',      'date_range'),
  ('vehicle',   'date_range'),
  ('pg',        'date_range'),
  ('goods',     'inventory'),
  ('tour',      'departure'),
  ('service',   'always'),
  ('expert',    'slot'),
  ('education', 'slot')
on conflict (name) do nothing;


-- cities (India + diaspora hubs) ─────────────────────────────────────────────
-- India: Gujarat hubs (Nagar heartland) + national metros
insert into public.cities (name, state, country) values
  -- Gujarat
  ('Ahmedabad',           'Gujarat',         'India'),
  ('Vadodara',            'Gujarat',         'India'),
  ('Surat',               'Gujarat',         'India'),
  ('Rajkot',              'Gujarat',         'India'),
  ('Bhavnagar',           'Gujarat',         'India'),
  ('Junagadh',            'Gujarat',         'India'),
  ('Jamnagar',            'Gujarat',         'India'),
  ('Porbandar',           'Gujarat',         'India'),
  ('Nadiad',              'Gujarat',         'India'),
  ('Anand',               'Gujarat',         'India'),
  ('Vallabh Vidyanagar',  'Gujarat',         'India'),
  ('Gandhinagar',         'Gujarat',         'India'),
  ('Bhuj',                'Gujarat',         'India'),
  ('Mehsana',             'Gujarat',         'India'),
  -- Other Indian metros / Nagar diaspora cities
  ('Mumbai',              'Maharashtra',     'India'),
  ('Pune',                'Maharashtra',     'India'),
  ('Bangalore',           'Karnataka',       'India'),
  ('Hyderabad',           'Telangana',       'India'),
  ('Chennai',             'Tamil Nadu',      'India'),
  ('Delhi',               'Delhi',           'India'),
  ('Gurgaon',             'Haryana',         'India'),
  ('Noida',               'Uttar Pradesh',   'India'),
  ('Kolkata',             'West Bengal',     'India'),
  ('Indore',              'Madhya Pradesh',  'India'),
  ('Bhopal',              'Madhya Pradesh',  'India'),
  ('Jaipur',              'Rajasthan',       'India'),
  -- USA (Indian diaspora hubs)
  ('New York',            'NY',              'USA'),
  ('Edison',              'NJ',              'USA'),
  ('Jersey City',         'NJ',              'USA'),
  ('San Francisco',       'CA',              'USA'),
  ('San Jose',            'CA',              'USA'),
  ('Los Angeles',         'CA',              'USA'),
  ('Chicago',             'IL',              'USA'),
  ('Houston',             'TX',              'USA'),
  ('Dallas',              'TX',              'USA'),
  ('Atlanta',             'GA',              'USA'),
  ('Boston',              'MA',              'USA'),
  ('Seattle',             'WA',              'USA'),
  ('Salt Lake City',      'UT',              'USA'),
  -- UK
  ('London',              'England',         'UK'),
  ('Birmingham',          'England',         'UK'),
  ('Manchester',          'England',         'UK'),
  ('Leicester',           'England',         'UK'),
  -- Gulf
  ('Dubai',               null,              'UAE'),
  ('Abu Dhabi',           null,              'UAE'),
  ('Sharjah',             null,              'UAE'),
  ('Doha',                null,              'Qatar'),
  ('Muscat',              null,              'Oman'),
  ('Riyadh',              null,              'Saudi Arabia'),
  ('Jeddah',              null,              'Saudi Arabia'),
  -- East Africa
  ('Nairobi',             null,              'Kenya'),
  ('Mombasa',             null,              'Kenya'),
  ('Kampala',             null,              'Uganda'),
  ('Dar es Salaam',       null,              'Tanzania'),
  -- East Asia
  ('Tokyo',               null,              'Japan'),
  ('Singapore',           null,              'Singapore'),
  ('Hong Kong',           null,              'Hong Kong'),
  -- Australia
  ('Sydney',              'NSW',             'Australia'),
  ('Melbourne',           'VIC',             'Australia'),
  ('Perth',               'WA',              'Australia'),
  ('Brisbane',            'QLD',             'Australia'),
  -- Canada
  ('Toronto',             'ON',              'Canada'),
  ('Mississauga',         'ON',              'Canada'),
  ('Vancouver',           'BC',              'Canada'),
  ('Calgary',             'AB',              'Canada'),
  ('Montreal',            'QC',              'Canada')
on conflict (name, state, country) do nothing;


-- professions ───────────────────────────────────────────────────────────────
insert into public.professions (name) values
  ('Doctor'),
  ('Engineer'),
  ('Software Engineer'),
  ('Lawyer'),
  ('Chartered Accountant'),
  ('Teacher'),
  ('Professor'),
  ('Scientist'),
  ('Architect'),
  ('Pharmacist'),
  ('Dentist'),
  ('Nurse'),
  ('Veterinarian'),
  ('Banker'),
  ('Consultant'),
  ('Entrepreneur'),
  ('Researcher'),
  ('Journalist'),
  ('Artist'),
  ('Designer'),
  ('Manager'),
  ('Civil Servant'),
  ('Police Officer'),
  ('Military Officer'),
  ('Diplomat'),
  ('Trader'),
  ('Farmer'),
  ('Student'),
  ('Homemaker'),
  ('Retired Professional')
on conflict (name) do nothing;


-- specialties (detailed for Doctor / Engineer / Software / Lawyer / CA / Teacher) ──
-- Linked via profession name lookup so re-runs don't depend on a fixed UUID.
insert into public.specialties (profession_id, name)
select p.id, s.name
from public.professions p,
     (values
       ('General Physician'),
       ('Cardiologist'),
       ('Neurologist'),
       ('Pediatrician'),
       ('Gynaecologist'),
       ('Orthopaedic Surgeon'),
       ('Dermatologist'),
       ('Ophthalmologist'),
       ('Psychiatrist'),
       ('General Surgeon'),
       ('Oncologist'),
       ('Endocrinologist'),
       ('ENT Specialist'),
       ('Gastroenterologist'),
       ('Pulmonologist'),
       ('Nephrologist'),
       ('Anesthesiologist'),
       ('Radiologist'),
       ('Pathologist'),
       ('Urologist')
     ) as s(name)
where p.name = 'Doctor'
on conflict (profession_id, name) do nothing;

insert into public.specialties (profession_id, name)
select p.id, s.name
from public.professions p,
     (values
       ('Civil'),
       ('Mechanical'),
       ('Electrical'),
       ('Chemical'),
       ('Electronics'),
       ('Aerospace'),
       ('Biomedical'),
       ('Industrial'),
       ('Metallurgical')
     ) as s(name)
where p.name = 'Engineer'
on conflict (profession_id, name) do nothing;

insert into public.specialties (profession_id, name)
select p.id, s.name
from public.professions p,
     (values
       ('Frontend'),
       ('Backend'),
       ('Full-stack'),
       ('Data Engineer'),
       ('ML / AI Engineer'),
       ('DevOps / SRE'),
       ('Mobile'),
       ('Security'),
       ('QA / Test'),
       ('Embedded')
     ) as s(name)
where p.name = 'Software Engineer'
on conflict (profession_id, name) do nothing;

insert into public.specialties (profession_id, name)
select p.id, s.name
from public.professions p,
     (values
       ('Corporate'),
       ('Litigation'),
       ('Family'),
       ('Tax'),
       ('Intellectual Property'),
       ('Criminal'),
       ('Constitutional')
     ) as s(name)
where p.name = 'Lawyer'
on conflict (profession_id, name) do nothing;

insert into public.specialties (profession_id, name)
select p.id, s.name
from public.professions p,
     (values
       ('Audit'),
       ('Taxation'),
       ('Forensic'),
       ('Advisory')
     ) as s(name)
where p.name = 'Chartered Accountant'
on conflict (profession_id, name) do nothing;

insert into public.specialties (profession_id, name)
select p.id, s.name
from public.professions p,
     (values
       ('Primary'),
       ('Secondary'),
       ('Higher Secondary')
     ) as s(name)
where p.name = 'Teacher'
on conflict (profession_id, name) do nothing;
