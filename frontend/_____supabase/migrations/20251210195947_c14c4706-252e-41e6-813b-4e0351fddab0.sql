-- Criar a agência Voyu
INSERT INTO public.agencies (id, name, email, is_active)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Voyu', 'contato@voyu.com.br', true);

-- Criar profile para o super admin
INSERT INTO public.profiles (id, name, email, agency_id)
VALUES ('96118975-6d6b-4bdd-a97a-3a8f2ccc0ea2', 'Nilson Braga', 'nilsonbragax@gmail.com', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Criar role super_admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('96118975-6d6b-4bdd-a97a-3a8f2ccc0ea2', 'super_admin');