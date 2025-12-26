import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin' | 'agent';
  agency_id?: string; // Optional for super_admin
  collaborator_id?: string; // Optional - link to existing collaborator
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if requesting user is admin or super_admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    const isRequestingSuperAdmin = roleData?.role === 'super_admin';

    if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'super_admin')) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para criar usuários" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, password, name, role, agency_id, collaborator_id }: CreateUserRequest = await req.json();

    // Only super_admin can create other super_admins
    if (role === 'super_admin' && !isRequestingSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas super administradores podem criar outros super administradores" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Creating user ${email} for agency ${agency_id || 'no agency'} with role ${role}`);

    let userId: string;

    // Try to create the user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError) {
      // If user already exists, try to find and reassign them
      if (createError.message?.includes("already been registered") || (createError as any).code === "email_exists") {
        console.log(`User ${email} already exists, checking if can be reassigned...`);
        
        // Find the existing user
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error("Error listing users:", listError);
          return new Response(
            JSON.stringify({ error: "Erro ao verificar usuário existente" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        
        const existingUser = existingUsers.users.find(u => u.email === email);
        
        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: "Usuário não encontrado" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        
        // Check if user already has an active agency
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("agency_id")
          .eq("id", existingUser.id)
          .single();
        
        if (existingProfile?.agency_id) {
          // Check if that agency still exists
          const { data: agencyExists } = await supabaseAdmin
            .from("agencies")
            .select("id")
            .eq("id", existingProfile.agency_id)
            .single();
          
          if (agencyExists) {
            return new Response(
              JSON.stringify({ error: "Este email já está associado a outra agência ativa. Use outro email." }),
              { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }
        
        // User exists but has no active agency - reassign them
        console.log(`Reassigning user ${email} to agency ${agency_id}`);
        userId = existingUser.id;
        
        // Update the password if provided
        if (password) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
            user_metadata: { name },
          });
          
          if (updateError) {
            console.error("Error updating user password:", updateError);
          }
        }
      } else {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      userId = userData.user.id;
    }

    // Update profile with agency_id (optional for super_admin)
    const profileUpdate: any = { name };
    if (agency_id) {
      profileUpdate.agency_id = agency_id;
    }
    
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Update user role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role })
      .eq("user_id", userId);

    if (roleError) {
      console.error("Error updating role:", roleError);
    }

    // Handle collaborator linking
    if (agency_id) {
      // If collaborator_id is provided, link the user to the existing collaborator
      if (collaborator_id) {
        const { error: updateCollaboratorError } = await supabaseAdmin
          .from("collaborators")
          .update({
            user_id: userId,
            status: 'active',
          })
          .eq("id", collaborator_id)
          .eq("agency_id", agency_id);
        
        if (updateCollaboratorError) {
          console.error("Error linking user to collaborator:", updateCollaboratorError);
        } else {
          console.log(`Linked user ${email} to existing collaborator ${collaborator_id}`);
        }
      } else {
        // Create new collaborator if no collaborator_id provided
        // Get or create team based on role
        const teamName = role === 'admin' ? 'Gerentes' : 'Vendedores';
        
        let teamId: string | null = null;
        
        // Check if team exists
        const { data: existingTeam } = await supabaseAdmin
          .from("teams")
          .select("id")
          .eq("agency_id", agency_id)
          .eq("name", teamName)
          .single();
        
        if (existingTeam) {
          teamId = existingTeam.id;
        } else {
          // Create the team
          const { data: newTeam, error: teamError } = await supabaseAdmin
            .from("teams")
            .insert({
              agency_id,
              name: teamName,
              description: role === 'admin' ? 'Equipe de gerentes' : 'Equipe de vendedores',
              is_active: true,
            })
            .select("id")
            .single();
          
          if (teamError) {
            console.error("Error creating team:", teamError);
          } else {
            teamId = newTeam.id;
          }
        }

        // Check if collaborator already exists for this user
        const { data: existingCollaborator } = await supabaseAdmin
          .from("collaborators")
          .select("id")
          .eq("agency_id", agency_id)
          .eq("user_id", userId)
          .single();
        
        if (!existingCollaborator) {
          // Create collaborator
          const { error: collaboratorError } = await supabaseAdmin
            .from("collaborators")
            .insert({
              agency_id,
              user_id: userId,
              team_id: teamId,
              name,
              email,
              status: 'active',
              employment_type: 'clt',
              position: role === 'admin' ? 'Gerente' : 'Vendedor',
              level: role === 'admin' ? 'senior' : 'pleno',
              commission_percentage: 5,
              commission_base: 'profit',
            });
          
          if (collaboratorError) {
            console.error("Error creating collaborator:", collaboratorError);
          } else {
            console.log(`Created collaborator for user ${email}`);
          }
        } else {
          // Update existing collaborator
          const { error: updateCollaboratorError } = await supabaseAdmin
            .from("collaborators")
            .update({
              team_id: teamId,
              name,
              email,
              status: 'active',
            })
            .eq("id", existingCollaborator.id);
          
          if (updateCollaboratorError) {
            console.error("Error updating collaborator:", updateCollaboratorError);
          }
        }
      }
    }

    console.log(`User ${email} created successfully with id ${userId}`);

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in create-agency-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
