-- Atualizar função handle_new_user para dar super_admin ao email específico
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'), NEW.email);
  
  -- Se o email for nilsonbragax@gmail.com, dar super_admin
  IF NEW.email = 'nilsonbragax@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'agent');
  END IF;
  
  RETURN NEW;
END;
$$;