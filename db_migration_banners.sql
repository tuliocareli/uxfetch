-- Create ad_banners table
CREATE TABLE IF NOT EXISTS public.ad_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    alt_text TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    impressions_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for ad_banners
ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read active banners
CREATE POLICY "Public profiles are viewable by everyone." ON public.ad_banners FOR SELECT USING ( true );

-- Policy: only authenticated admins can insert/update/delete
CREATE POLICY "Admins can insert banners." ON public.ad_banners FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );
CREATE POLICY "Admins can update banners." ON public.ad_banners FOR UPDATE USING ( auth.role() = 'authenticated' );
CREATE POLICY "Admins can delete banners." ON public.ad_banners FOR DELETE USING ( auth.role() = 'authenticated' );

-- Create ad_clicks table
CREATE TABLE IF NOT EXISTS public.ad_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_id UUID NOT NULL REFERENCES public.ad_banners(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referrer TEXT
);

-- Enable RLS for ad_clicks
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can select clicks
CREATE POLICY "Admins can select clicks." ON public.ad_clicks FOR SELECT USING ( auth.role() = 'authenticated' );

-- Create RPC track_banner_view
CREATE OR REPLACE FUNCTION track_banner_view(p_banner_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.ad_banners
    SET impressions_count = impressions_count + 1
    WHERE id = p_banner_id AND status = 'active';
END;
$$;

-- Create RPC track_banner_click
CREATE OR REPLACE FUNCTION track_banner_click(p_banner_id UUID, p_referrer TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.ad_banners
    SET clicks_count = clicks_count + 1
    WHERE id = p_banner_id;
    
    INSERT INTO public.ad_clicks (banner_id, referrer)
    VALUES (p_banner_id, p_referrer);
END;
$$;
