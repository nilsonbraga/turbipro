-- Create default teams and migrate existing users to collaborators

-- Drop the function if it exists to recreate
DROP FUNCTION IF EXISTS public.create_default_teams_and_collaborators(uuid);

-- Function to create default teams and collaborators for an agency
CREATE OR REPLACE FUNCTION public.create_default_teams_and_collaborators(_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendedores_team_id uuid;
  gerentes_team_id uuid;
  user_record RECORD;
BEGIN
  -- Check if teams already exist for this agency
  SELECT id INTO vendedores_team_id FROM teams WHERE agency_id = _agency_id AND name = 'Vendedores';
  SELECT id INTO gerentes_team_id FROM teams WHERE agency_id = _agency_id AND name = 'Gerentes';
  
  -- Create Vendedores team if it doesn't exist
  IF vendedores_team_id IS NULL THEN
    INSERT INTO teams (agency_id, name, description, is_active)
    VALUES (_agency_id, 'Vendedores', 'Equipe de vendedores', true)
    RETURNING id INTO vendedores_team_id;
  END IF;
  
  -- Create Gerentes team if it doesn't exist
  IF gerentes_team_id IS NULL THEN
    INSERT INTO teams (agency_id, name, description, is_active)
    VALUES (_agency_id, 'Gerentes', 'Equipe de gerentes', true)
    RETURNING id INTO gerentes_team_id;
  END IF;
  
  -- Migrate existing users to collaborators
  FOR user_record IN 
    SELECT p.id, p.name, p.email, p.phone, ur.role
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.agency_id = _agency_id
  LOOP
    -- Check if collaborator already exists
    IF NOT EXISTS (
      SELECT 1 FROM collaborators 
      WHERE agency_id = _agency_id AND user_id = user_record.id
    ) THEN
      -- Create collaborator based on role
      INSERT INTO collaborators (
        agency_id,
        user_id,
        team_id,
        name,
        email,
        phone,
        status,
        employment_type,
        position,
        level,
        commission_percentage,
        commission_base
      )
      VALUES (
        _agency_id,
        user_record.id,
        CASE 
          WHEN user_record.role IN ('admin', 'super_admin') THEN gerentes_team_id
          ELSE vendedores_team_id
        END,
        COALESCE(user_record.name, 'Sem nome'),
        user_record.email,
        user_record.phone,
        'active',
        'clt'::employment_type,
        CASE 
          WHEN user_record.role IN ('admin', 'super_admin') THEN 'Gerente'
          ELSE 'Vendedor'
        END,
        CASE 
          WHEN user_record.role IN ('admin', 'super_admin') THEN 'senior'::collaborator_level
          ELSE 'pleno'::collaborator_level
        END,
        5,
        'profit'::commission_base
      );
    END IF;
  END LOOP;
END;
$$;

-- Run migration for all existing agencies
DO $$
DECLARE
  agency_record RECORD;
BEGIN
  FOR agency_record IN SELECT id FROM agencies
  LOOP
    PERFORM create_default_teams_and_collaborators(agency_record.id);
  END LOOP;
END $$;