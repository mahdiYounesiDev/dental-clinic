Act as a Senior Full-Stack Developer. I am developing a comprehensive dental clinic management system named "LumiDent". The system includes a main landing page, a patient booking panel, a secretary/receptionist dashboard, and a doctor's dashboard.

The Front-End is built with HTML, Vanilla CSS (modular), and Vanilla JS (ES6 Modules). The Back-End is completely powered by Supabase (PostgreSQL + Auth).

Below is the exact project blueprint, database schema, table relationships, and UI/UX architecture. Keep this entire context in your memory and use it as the foundation for any code, debugging, or feature requests I make.

=========================================
PART 1: DATABASE SCHEMA & RELATIONSHIPS
=========================================
* Security Note: Row Level Security (RLS) is ENABLED on all tables, but we are using an open policy (`USING (true) WITH CHECK (true)`) to allow front-end JavaScript to handle insertions directly without triggering 500 errors. No DB triggers are used for Auth syncing.

1. `profiles` Table (User Data)
- `id` (UUID, Primary Key) -> Linked to `auth.users.id`.
- `email` (TEXT)
- `name` (TEXT)
- `family` (TEXT)
- `phone` (TEXT)
- `role` (TEXT) -> Values: 'user' (default), 'doctor', 'secretary', 'admin'.
- `created_at` (TIMESTAMP)

2. `doctors` Table (Doctor Profiles)
- `id` (UUID, Primary Key)
- `doctorName` (TEXT)
- `doctorFamily` (TEXT)
- `doctorSpecializations` (JSON or String array)
- `doctorDegree` (TEXT)
- `doctorWorkExperience` (NUMERIC)
- `doctorPhone` (TEXT)
- `avatarUrl` (TEXT)

3. `services` Table (Clinic Services)
- `id` (UUID or INT, Primary Key)
- `serviceName` or `title` (TEXT)
- `serviceDescription` or `desc` (TEXT)
- `price` (NUMERIC) -> Total cost of the treatment.
- `prepayment` (NUMERIC) -> Required deposit for booking.
- `serviceDoctorId` (UUID, Foreign Key) -> References `doctors.id`. (Defines which doctor performs this service).

4. `appointments` Table (Booking & Workflow)
- `id` (UUID or String, Primary Key)
- `userId` (UUID, Foreign Key, Nullable) -> References `profiles.id`. (Can be null for walk-in patients).
- `doctorId` (UUID, Foreign Key) -> References `doctors.id`.
- `patient_name` (TEXT)
- `patient_phone` (TEXT)
- `patient_notes` (TEXT)
- `serviceName` (TEXT)
- `doctorName` (TEXT)
- `appointmentDate` / `date` (TEXT) -> Stored in Persian Date format (e.g., "۱۲ اردیبهشت ۱۴۰۵").
- `appointmentTime` / `time` (TEXT) -> Time slot (e.g., "10:00 - 11:00").
- `status` (TEXT) -> Crucial State Machine. Values must be in Persian: 'در حال بررسی' (Pending), 'تایید شده' (Approved), 'ویزیت شده' (Visited), 'عدم مراجعه' (No-show), 'رد شده' (Rejected), 'کنسل شده' (Cancelled).
- `payment_status` (TEXT) -> Values: 'unpaid', 'prepaid', 'settled', 'paid'.
- `total_price` (NUMERIC)
- `paid_amount` (NUMERIC)
- `doctor_notes` (TEXT) -> Used by doctors to write prescriptions/case history after a visit.
- `secretary_note` (TEXT) -> Used by secretaries for administrative notes.

=========================================
PART 2: FRONT-END FILE ARCHITECTURE
=========================================
The project strictly follows a modular Clean Architecture approach:

📁 /css/ (Modular Vanilla CSS using CSS variables)
- `variables.css`: Root colors (--color-primary, --color-dark, --color-sky, --color-mint), spacing, font sizes.
- `reset.css` & `fonts.css`: Base resets and custom Persian fonts (Lalezar, Vazirmatn).
- `nav_menu.css`: Floating Glassmorphism pill-shaped navbar that shrinks and darkens on scroll.
- `hero.css`: Ultra-premium cinematic hero section. Uses multi-layer parallax scrolling, ambient glowing orbs, backdrop-filter glass cards, and staggered fade-up animations.
- `services.css`: Compact, ultra-premium service cards. Features a high-contrast dark-mode finance box inside the card for pricing, soft elevation hover effects, and minimal typography.

📁 /js/services_js/ (Supabase API Handlers)
- `supabaseClient.js`: Supabase initialization.
- `auth_service.js`: Handles Auth (signUp, signIn, signOut) and manually inserts users into the `profiles` table.
- `services_service.js` & `doctors_service.js`: Fetches master data.
- `appointments_service.js`: Handles CRUD for appointments, status updates, and note insertions (`updateAppointmentNotes`).

📁 /js/components_js/ (UI Logic)
- `nav_menu.js`: Handles scroll listeners for the glass navbar, mobile hamburger menu, and User Dropdown state.
- `hero.js`: Handles IntersectionObserver to pause background video when out of view, and applies complex `translate3d` math for multi-layer parallax effects.
- `appointment_modal.js`: The core booking engine. Handles Persian calendar logic, time slot availability checking, pre-payment mock gateway, and inserts appointments strictly with a 'در حال بررسی' (Pending) status.

📁 /js/pages_js/ (Page Controllers)
- `home.js`: Dynamically renders the services and doctors grids by injecting advanced HTML structures to match the premium CSS.
- `secretary.js`: Dashboard for 'secretary'/'admin' roles. Fetches all appointments, filters by 'Pending', allows Walk-in registrations (creating guest appointments or new auth users), and can update status to 'Approved' or 'Rejected'.
- `doctor.js`: Dashboard for 'doctor' role. Automatically filters appointments based on `doctorId` or `doctorName`. ONLY displays appointments that are 'Approved' (تایید شده). Allows doctor to mark as 'Visited' or 'No-show', strictly checks `payment_status` before allowing visits, and opens a modal to save `doctor_notes`. Uses Supabase Realtime (WebSockets) for auto-updating the UI.

=========================================
PART 3: BUSINESS LOGIC & WORKFLOWS
=========================================
Strict Appointment State Machine:
1. User requests an appointment (even if prepaid) -> Status is ALWAYS saved as 'در حال بررسی' (Pending).
2. Secretary reviews it in the Secretary Panel. If approved -> Status changes to 'تایید شده' (Approved).
3. The appointment now appears in the specific Doctor's Panel.
4. Doctor checks if `payment_status` is cleared. If yes, visits the patient -> Status changes to 'ویزیت شده' (Visited).
5. Doctor clicks "Add Note" -> Saves prescription in `doctor_notes`.
6. At any point, the patient's full history can be viewed by querying appointments where `patient_phone` or `userId` match.

Acknowledge that you have loaded this blueprint into your memory and are ready for my next instructions.
