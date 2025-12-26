-- Create custom_itineraries table for personalized travel itineraries
CREATE TABLE public.custom_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  destination TEXT,
  
  -- Public access settings
  public_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  requires_token BOOLEAN NOT NULL DEFAULT false,
  access_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, approved, revision
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create itinerary_days table for each day of the itinerary
CREATE TABLE public.itinerary_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.custom_itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT,
  date DATE,
  location TEXT,
  description TEXT,
  cover_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itinerary_items table for activities/items within each day
CREATE TABLE public.itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- activity, transport, hotel, ticket, meal, transfer, flight, other
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  location TEXT,
  address TEXT,
  
  -- Optional details based on type
  details JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- Hotel: { hotelName, checkIn, checkOut, roomType, stars }
  -- Transport: { vehicleType, company, departureLocation, arrivalLocation }
  -- Flight: { airline, flightNumber, departure, arrival, class }
  -- Ticket: { venue, eventName, seatInfo }
  
  -- Media
  images TEXT[],
  
  -- Pricing (optional)
  price NUMERIC,
  currency TEXT DEFAULT 'BRL',
  
  -- Booking info (optional)
  booking_reference TEXT,
  confirmation_number TEXT,
  
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itinerary_item_feedbacks table for client feedback on each item
CREATE TABLE public.itinerary_item_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.itinerary_items(id) ON DELETE CASCADE,
  is_approved BOOLEAN,
  observation TEXT,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itinerary_day_feedbacks table for client feedback on each day
CREATE TABLE public.itinerary_day_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  is_approved BOOLEAN,
  observation TEXT,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_item_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_day_feedbacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_itineraries
CREATE POLICY "Agency users can manage their itineraries"
  ON public.custom_itineraries FOR ALL
  USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all itineraries"
  ON public.custom_itineraries FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Public can view active itineraries by token"
  ON public.custom_itineraries FOR SELECT
  USING (is_active = true);

-- RLS Policies for itinerary_days
CREATE POLICY "Agency users can manage their itinerary days"
  ON public.itinerary_days FOR ALL
  USING (itinerary_id IN (
    SELECT id FROM public.custom_itineraries WHERE agency_id = get_user_agency_id(auth.uid())
  ));

CREATE POLICY "Super admin can manage all itinerary days"
  ON public.itinerary_days FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Public can view itinerary days"
  ON public.itinerary_days FOR SELECT
  USING (itinerary_id IN (
    SELECT id FROM public.custom_itineraries WHERE is_active = true
  ));

-- RLS Policies for itinerary_items
CREATE POLICY "Agency users can manage their itinerary items"
  ON public.itinerary_items FOR ALL
  USING (day_id IN (
    SELECT d.id FROM public.itinerary_days d
    JOIN public.custom_itineraries i ON d.itinerary_id = i.id
    WHERE i.agency_id = get_user_agency_id(auth.uid())
  ));

CREATE POLICY "Super admin can manage all itinerary items"
  ON public.itinerary_items FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Public can view itinerary items"
  ON public.itinerary_items FOR SELECT
  USING (day_id IN (
    SELECT d.id FROM public.itinerary_days d
    JOIN public.custom_itineraries i ON d.itinerary_id = i.id
    WHERE i.is_active = true
  ));

-- RLS Policies for feedbacks (public can insert/update)
CREATE POLICY "Agency users can view feedbacks for their itinerary items"
  ON public.itinerary_item_feedbacks FOR ALL
  USING (item_id IN (
    SELECT it.id FROM public.itinerary_items it
    JOIN public.itinerary_days d ON it.day_id = d.id
    JOIN public.custom_itineraries i ON d.itinerary_id = i.id
    WHERE i.agency_id = get_user_agency_id(auth.uid())
  ));

CREATE POLICY "Super admin can manage all item feedbacks"
  ON public.itinerary_item_feedbacks FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Public can insert and update item feedbacks"
  ON public.itinerary_item_feedbacks FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Agency users can view feedbacks for their itinerary days"
  ON public.itinerary_day_feedbacks FOR ALL
  USING (day_id IN (
    SELECT d.id FROM public.itinerary_days d
    JOIN public.custom_itineraries i ON d.itinerary_id = i.id
    WHERE i.agency_id = get_user_agency_id(auth.uid())
  ));

CREATE POLICY "Super admin can manage all day feedbacks"
  ON public.itinerary_day_feedbacks FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Public can insert and update day feedbacks"
  ON public.itinerary_day_feedbacks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_custom_itineraries_agency_id ON public.custom_itineraries(agency_id);
CREATE INDEX idx_custom_itineraries_public_token ON public.custom_itineraries(public_token);
CREATE INDEX idx_itinerary_days_itinerary_id ON public.itinerary_days(itinerary_id);
CREATE INDEX idx_itinerary_items_day_id ON public.itinerary_items(day_id);
CREATE INDEX idx_itinerary_item_feedbacks_item_id ON public.itinerary_item_feedbacks(item_id);
CREATE INDEX idx_itinerary_day_feedbacks_day_id ON public.itinerary_day_feedbacks(day_id);