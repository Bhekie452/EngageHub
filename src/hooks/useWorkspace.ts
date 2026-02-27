import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useWorkspace() {
  const { user } = useAuth()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setWorkspaceId(null)
      setLoading(false)
      return
    }

    const fetchWorkspace = async () => {
      try {
        setLoading(true)
        setError(null)

        // First try to get workspace from workspace_members
        // Using a more robust query approach
        const { data: memberData, error: memberError } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .limit(1)

        // Handle potential errors or empty results
        if (memberError) {
          console.warn('[useWorkspace] workspace_members query error:', memberError.message)
          // Don't fail immediately - try the fallback
        } else if (memberData && memberData.length > 0 && memberData[0]) {
          setWorkspaceId(memberData[0].workspace_id)
          return
        }

        // If not a member, check if user owns a workspace
        const { data: ownerData, error: ownerError } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)

        if (ownerError) {
          console.warn('[useWorkspace] workspaces query error:', ownerError.message)
        } else if (ownerData && ownerData.length > 0 && ownerData[0]) {
          setWorkspaceId(ownerData[0].id)
          return
        }

        // If no workspace found, create a default one
        console.log('Creating default workspace for user:', user.id)
        
        // Generate a proper UUID for the workspace
        const workspaceId = crypto.randomUUID()
        console.log('Generated workspace UUID:', workspaceId)
        
        const { data: newWorkspace, error: createError } = await supabase
          .from('workspaces')
          .insert({
            id: workspaceId,
            name: user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Workspace` : 'My Workspace',
            slug: `${user.id}-workspace`,
            owner_id: user.id
          })
          .select('id')
          .single()

        console.log('New workspace created:', { data: newWorkspace, error: createError })

        if (newWorkspace && !createError) {
          setWorkspaceId(newWorkspace.id)
        } else {
          setError(createError?.message || 'Failed to create workspace')
        }

      } catch (err) {
        console.error('[useWorkspace] Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch workspace')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspace()
  }, [user])

  return { workspaceId, loading, error }
}
