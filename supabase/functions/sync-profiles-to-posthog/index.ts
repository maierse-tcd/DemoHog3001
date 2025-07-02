import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all profiles
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('*')

    if (error) throw error

    // Send profile data to PostHog for each user
    const postHogApiKey = Deno.env.get('POSTHOG_API_KEY') || 'phc_O1OL4R6b4MUWUsu8iYorqWfQoGSorFLHLOustqbVB0U'
    const postHogHost = 'https://ph.hogflix.dev'

    const promises = profiles.map(async (profile) => {
      if (!profile.email) return

      const postHogData = {
        api_key: postHogApiKey,
        event: '$identify',
        properties: {
          distinct_id: profile.email,
          $set: {
            name: profile.name,
            language: profile.language,
            is_kids_account: profile.is_kids,
            email: profile.email,
            supabase_id: profile.id,
          }
        }
      }

      try {
        const response = await fetch(`${postHogHost}/capture/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postHogData)
        })

        if (!response.ok) {
          console.error(`Failed to sync profile ${profile.id} to PostHog:`, await response.text())
        } else {
          console.log(`Successfully synced profile ${profile.id} to PostHog`)
        }
      } catch (error) {
        console.error(`Error syncing profile ${profile.id} to PostHog:`, error)
      }
    })

    await Promise.all(promises)

    return new Response(
      JSON.stringify({ 
        message: `Successfully synced ${profiles.length} profiles to PostHog`,
        synced_count: profiles.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})