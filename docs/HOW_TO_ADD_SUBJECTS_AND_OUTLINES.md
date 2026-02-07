# How to Add Subjects and Outlines - Complete Guide

## 📍 Where to Add Content

### **Option 1: Using Admin Panel (Recommended - Easy)**

#### 1. Add Subjects
**URL**: `http://localhost:3000/admin/syllabus`

**Steps**:
1. Login as admin
2. Navigate to **Admin → Syllabus**
3. Upload a JSON file with subjects and topics

**JSON Format**:
```json
{
  "course_id": "your-gpat-course-id",
  "subjects": [
    {
      "name": "Pharmacognosy",
      "order": 1,
      "topics": [
        {
          "name": "Alkaloids",
          "slug": "alkaloids",
          "order": 1,
          "is_free_preview": true
        },
        {
          "name": "Glycosides",
          "slug": "glycosides",
          "order": 2,
          "is_free_preview": false
        }
      ]
    }
  ]
}
```

#### 2. Add Outlines (Topic Structure)
**URL**: `http://localhost:3000/admin/outlines`

**Steps**:
1. Login as admin
2. Navigate to **Admin → Outlines**
3. Create or edit outlines for topics

**Outline Format** (JSON array):
```json
[
  "Introduction",
  "Core Theory",
  "Key Concepts & Definitions",
  "Mechanisms / Processes",
  "Important Tables",
  "Exam Traps & Common Mistakes",
  "Rapid Revision Box",
  "One-liners / Memory Facts",
  "GPAT-Style MCQs"
]
```

---

### **Option 2: Using SQL Database (Advanced)**

#### 1. Add Subjects Directly to Database

**File**: `supabase/migrations/new_migration.sql`

```sql
-- Insert new subjects
INSERT INTO syllabus_subjects (name, "order", course_id) VALUES
  ('Pharmacognosy', 1, 'your-course-id-here'),
  ('Pharmaceutical Regulatory Science', 2, 'your-course-id-here'),
  ('Biostatistics and Research Methodology', 3, 'your-course-id-here'),
  ('Pharmacovigilance', 4, 'your-course-id-here'),
  ('Cosmetic Science', 5, 'your-course-id-here'),
  ('Herbal Drug Technology', 6, 'your-course-id-here'),
  ('Computer Aided Drug Design', 7, 'your-course-id-here'),
  ('Social and Preventive Pharmacy', 8, 'your-course-id-here'),
  ('Experimental Pharmacology', 9, 'your-course-id-here');
```

#### 2. Add Topics for Each Subject

```sql
-- Get subject ID first
SELECT id FROM syllabus_subjects WHERE name = 'Pharmacognosy';

-- Insert topics (replace subject_id with actual UUID)
INSERT INTO syllabus_topics (subject_id, course_id, name, slug, "order", is_free_preview) VALUES
  ('subject-uuid', 'course-uuid', 'Alkaloids', 'alkaloids', 1, true),
  ('subject-uuid', 'course-uuid', 'Glycosides', 'glycosides', 2, false),
  ('subject-uuid', 'course-uuid', 'Terpenoids', 'terpenoids', 3, false),
  ('subject-uuid', 'course-uuid', 'Volatile Oils', 'volatile-oils', 4, false),
  ('subject-uuid', 'course-uuid', 'Resins and Tannins', 'resins-tannins', 5, false);
```

#### 3. Add Outlines for Topics

```sql
-- Insert outline for a specific topic
INSERT INTO syllabus_outlines (subject_name, topic_name, outline, is_default) VALUES
  (
    'Pharmacognosy',
    'Alkaloids',
    '["Introduction", "Core Theory", "Key Concepts & Definitions", "Mechanisms / Processes", "Important Tables", "Exam Traps & Common Mistakes", "Rapid Revision Box", "One-liners / Memory Facts", "GPAT-Style MCQs"]'::jsonb,
    false
  );

-- Or create a DEFAULT outline for entire subject
INSERT INTO syllabus_outlines (subject_name, topic_name, outline, is_default) VALUES
  (
    'Pharmacognosy',
    '_default',
    '["Introduction", "Core Theory", "Classification and Types", "Chemical Constituents", "Identification Tests", "Therapeutic Uses", "Exam Traps & Common Mistakes", "Rapid Revision Box", "GPAT-Style MCQs"]'::jsonb,
    true
  );
```

---

## 🔑 **Database Schema Reference**

### Table: `syllabus_subjects`
```sql
id          uuid PRIMARY KEY
name        text UNIQUE NOT NULL
course_id   uuid REFERENCES courses(id)
order       integer DEFAULT 0
created_at  timestamp
```

### Table: `syllabus_topics`
```sql
id              uuid PRIMARY KEY
subject_id      uuid REFERENCES syllabus_subjects(id)
course_id       uuid REFERENCES courses(id)
name            text NOT NULL
slug            text NOT NULL
order           integer DEFAULT 0
is_free_preview boolean DEFAULT false
guardrails      jsonb (optional)
```

### Table: `syllabus_outlines`
```sql
id           uuid PRIMARY KEY
subject_name text NOT NULL
topic_name   text NOT NULL (use "_default" for subject-wide)
outline      jsonb NOT NULL (array of section headings)
description  text (optional)
is_default   boolean DEFAULT false
created_by   uuid (admin user id)
UNIQUE(subject_name, topic_name)
```

---

## 📋 **Missing Subjects You Need to Add**

Based on your screenshots, these subjects appear but may be missing from database:

1. **Pharmaceutical Biotechnology** ✓ (icon added)
2. **Social and Preventive Pharmacy** ✓ (icon added)
3. **Herbal Drug Technology** ✓ (icon added)
4. **Biostatistics and Research Methodology** ✓ (icon added)
5. **Pharmacovigilance** ✓ (icon added)
6. **Cosmetic Science** ✓ (icon added)
7. **Computer Aided Drug Design** ✓ (icon added)
8. **Experimental Pharmacology** ✓ (icon added)
9. **Pharmaceutical Regulatory Science** ✓ (icon added)

**All icons are now added to the codebase!**

---

## 🎯 **Quick Add via Admin Panel**

### Step-by-Step Process:

1. **Login as Admin**
   ```
   URL: http://localhost:3000/login
   Use admin credentials
   ```

2. **Navigate to Syllabus Upload**
   ```
   URL: http://localhost:3000/admin/syllabus
   ```

3. **Prepare JSON File** (`gpat-subjects.json`):
   ```json
   {
     "course_id": "get-from-database",
     "subjects": [
       {
         "name": "Pharmaceutical Regulatory Science",
         "order": 20,
         "topics": [
           {"name": "Drug Regulatory Affairs", "slug": "drug-regulatory-affairs", "order": 1, "is_free_preview": true},
           {"name": "ICH Guidelines", "slug": "ich-guidelines", "order": 2, "is_free_preview": false},
           {"name": "CDSCO Regulations", "slug": "cdsco-regulations", "order": 3, "is_free_preview": false}
         ]
       },
       {
         "name": "Biostatistics and Research Methodology",
         "order": 21,
         "topics": [
           {"name": "Descriptive Statistics", "slug": "descriptive-statistics", "order": 1, "is_free_preview": true},
           {"name": "Inferential Statistics", "slug": "inferential-statistics", "order": 2, "is_free_preview": false},
           {"name": "Research Design", "slug": "research-design", "order": 3, "is_free_preview": false}
         ]
       }
     ]
   }
   ```

4. **Upload the File**
   - Click "Choose File"
   - Select your JSON
   - Click "Upload Syllabus"

---

## 📝 **Standardized Outline Structure**

For **ALL topics**, use this 9-section outline:

```json
{
  "subject_name": "Subject Name",
  "topic_name": "Topic Name",
  "outline": [
    "Introduction",
    "Core Theory",
    "Key Concepts & Definitions",
    "Mechanisms / Processes",
    "Important Tables",
    "Exam Traps & Common Mistakes",
    "Rapid Revision Box",
    "One-liners / Memory Facts",
    "GPAT-Style MCQs"
  ],
  "is_default": false
}
```

**For subject-wide defaults**:
```json
{
  "subject_name": "Pharmacognosy",
  "topic_name": "_default",
  "outline": [...],
  "is_default": true
}
```

---

## 🗂️ **File Locations**

### Admin Pages:
- **Syllabus Upload**: `src/app/admin/syllabus/page.tsx`
- **Outlines Management**: `src/app/admin/outlines/page.tsx`
- **Courses Management**: `src/app/admin/courses/page.tsx`

### API Routes:
- **Bulk Upload**: `src/app/api/admin/syllabus/bulk/route.ts`
- **Create Outline**: `src/app/api/admin/outlines/route.ts`

### Database:
- **Schema**: `db/schema.sql`
- **Migrations**: `supabase/migrations/`

---

## 💡 **Quick Tips**

### Get Course ID:
```sql
SELECT id, name, code FROM courses WHERE is_active = true;
```

### Check Existing Subjects:
```sql
SELECT id, name, "order" 
FROM syllabus_subjects 
WHERE course_id = 'your-course-id'
ORDER BY "order";
```

### Check Missing Subjects:
Compare your database list with this complete list:
1. Physical Chemistry
2. Medicinal Chemistry
3. Pharmaceutical Analysis
4. Physical Pharmacy
5. Pharmaceutics
6. Organic Chemistry
7. Pharmacology
8. Pharmaceutical Chemistry
9. Human Anatomy and Physiology
10. Pharmaceutical Organic Chemistry
11. Pharmaceutical Inorganic Chemistry
12. Pharmacognosy
13. Pathophysiology
14. Biochemistry
15. Microbiology
16. Industrial Pharmacy
17. Quality Assurance
18. Biopharmaceutics and Pharmacokinetics
19. Novel Drug Delivery Systems
20. Instrumental Methods of Analysis
21. Pharmacy Practice and Jurisprudence
22. Pharmaceutical Biotechnology
23. Clinical Pharmacy
24. Hospital Pharmacy
25. Community Pharmacy
26. **Pharmaceutical Regulatory Science** ← Add this
27. **Biostatistics and Research Methodology** ← Add this
28. **Pharmacovigilance** ← Add this
29. **Cosmetic Science** ← Add this
30. **Herbal Drug Technology** ← Add this
31. **Computer Aided Drug Design** ← Add this
32. **Social and Preventive Pharmacy** ← Add this
33. **Experimental Pharmacology** ← Add this

---

## ⚡ **Quick SQL to Add All Missing Subjects**

```sql
-- First, get your GPAT course ID
SELECT id FROM courses WHERE code = 'GPAT' LIMIT 1;

-- Replace 'YOUR-COURSE-ID' below with actual UUID

INSERT INTO syllabus_subjects (name, "order", course_id) VALUES
  ('Pharmaceutical Regulatory Science', 26, 'YOUR-COURSE-ID'),
  ('Biostatistics and Research Methodology', 27, 'YOUR-COURSE-ID'),
  ('Pharmacovigilance', 28, 'YOUR-COURSE-ID'),
  ('Cosmetic Science', 29, 'YOUR-COURSE-ID'),
  ('Herbal Drug Technology', 30, 'YOUR-COURSE-ID'),
  ('Computer Aided Drug Design', 31, 'YOUR-COURSE-ID'),
  ('Social and Preventive Pharmacy', 32, 'YOUR-COURSE-ID'),
  ('Experimental Pharmacology', 33, 'YOUR-COURSE-ID')
ON CONFLICT (name, course_id) DO NOTHING;
```

---

## 🎨 **Subject Icons Are Already Added**

All icons are configured in: `src/app/subjects/page.tsx`

Including the missing subjects:
- ✅ Pharmaceutical Regulatory Science → Scale icon
- ✅ Biostatistics and Research Methodology → TestTube2 icon
- ✅ Pharmacovigilance → ShieldCheck icon
- ✅ Cosmetic Science → Beaker icon
- ✅ Herbal Drug Technology → FlaskConical icon
- ✅ Computer Aided Drug Design → Microscope icon
- ✅ Social and Preventive Pharmacy → Stethoscope icon
- ✅ Experimental Pharmacology → TestTubeDiagonal icon

All colors are sky blue theme variations!

---

## 🚀 **Testing After Adding**

1. **Add subjects via admin or SQL**
2. **Refresh subjects page**: `/subjects`
3. **Verify icons display correctly**
4. **Click on subject** → Should show topics
5. **Generate notes** → Should use 9-section structure

---

## 📊 **Verification Checklist**

- [ ] All subjects have unique icons
- [ ] All subjects have sky blue gradient colors
- [ ] Icons display on subjects page
- [ ] Topics load when clicking subject
- [ ] Outlines are configured (or use default 9-section)
- [ ] Notes generate successfully
- [ ] Mobile responsive on all pages

---

## 📞 **If You Need Help**

**To see current subjects**:
```sql
SELECT COUNT(*) as total_subjects 
FROM syllabus_subjects 
WHERE course_id = 'your-course-id';
```

**To see subjects without topics**:
```sql
SELECT s.name, COUNT(t.id) as topic_count
FROM syllabus_subjects s
LEFT JOIN syllabus_topics t ON t.subject_id = s.id
WHERE s.course_id = 'your-course-id'
GROUP BY s.id, s.name
HAVING COUNT(t.id) = 0;
```

**To see topics without outlines**:
```sql
SELECT DISTINCT s.name as subject, t.name as topic
FROM syllabus_topics t
JOIN syllabus_subjects s ON s.id = t.subject_id
WHERE NOT EXISTS (
  SELECT 1 FROM syllabus_outlines o
  WHERE o.subject_name = s.name 
  AND (o.topic_name = t.name OR (o.topic_name = '_default' AND o.is_default = true))
)
ORDER BY s.name, t.name;
```

---

## 🎓 **Summary**

**Admin Panel** (Easy):
- URL: `/admin/syllabus` for subjects
- URL: `/admin/outlines` for topic structure
- Upload JSON files

**Database** (Advanced):
- Insert into `syllabus_subjects` table
- Insert into `syllabus_topics` table  
- Insert into `syllabus_outlines` table

**Icons**: ✅ Already added for ALL subjects in `src/app/subjects/page.tsx`
**Colors**: ✅ All using sky blue theme
**Structure**: ✅ 9-section rapid-revision format enforced

---

**Your app is now ready with:**
- Beautiful sky blue theme
- Mobile responsive design
- Professional loading messages
- All subject icons added
- Complete subject coverage (33 subjects)

**Just add the subject data via admin panel or SQL!**
