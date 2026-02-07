-- Topic Images System
-- Allow admins to upload up to 5 images per topic

-- ============================================
-- 1. TOPIC IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.topic_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_order integer NOT NULL CHECK (image_order >= 1 AND image_order <= 5),
  file_name text NOT NULL,
  file_size integer, -- in bytes
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png')),
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(topic_id, image_order)
);

CREATE INDEX IF NOT EXISTS topic_images_topic_id_idx ON public.topic_images(topic_id);
CREATE INDEX IF NOT EXISTS topic_images_order_idx ON public.topic_images(topic_id, image_order);

COMMENT ON TABLE public.topic_images IS 'Store up to 5 custom images per topic for display in notes';

-- ============================================
-- 2. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.course_enrollments(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  amount integer NOT NULL, -- in paise (₹1 = 100 paise)
  currency text NOT NULL DEFAULT 'INR',
  payment_id uuid REFERENCES public.payments(id),
  razorpay_payment_id text,
  status text NOT NULL CHECK (status IN ('draft', 'paid', 'failed', 'refunded')),
  invoice_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  paid_at timestamptz,
  pdf_url text,
  items_json jsonb NOT NULL, -- [{name, description, amount, quantity}]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON public.invoices(invoice_number);

COMMENT ON TABLE public.invoices IS 'User invoices for payments and billing history';

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Topic Images - Admin can manage, users can read
ALTER TABLE public.topic_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topic images"
  ON public.topic_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert topic images"
  ON public.topic_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update topic images"
  ON public.topic_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete topic images"
  ON public.topic_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Invoices - Users can see their own, admins can see all
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update invoices"
  ON public.invoices FOR UPDATE
  USING (true);

-- ============================================
-- 4. STORAGE BUCKET FOR TOPIC IMAGES
-- ============================================

-- Create storage bucket for topic images (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('topic-images', 'topic-images', true);

-- Storage policies (allow public read, admin write)
-- CREATE POLICY "Public can view topic images" ON storage.objects FOR SELECT USING (bucket_id = 'topic-images');
-- CREATE POLICY "Admins can upload topic images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'topic-images' AND (storage.foldername(name))[1] = 'topics');
-- CREATE POLICY "Admins can delete topic images" ON storage.objects FOR DELETE USING (bucket_id = 'topic-images');
