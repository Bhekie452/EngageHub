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
        const { data: memberData, error: memberError } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (memberData && !memberError) {
          setWorkspaceId(memberData.workspace_id)
          return
        }

        // If not a member, check if user owns a workspace
        const { data: ownerData, error: ownerError } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .single()

        if (ownerData && !ownerError) {
          setWorkspaceId(ownerData.id)
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
        setError(err instanceof Error ? err.message : 'Failed to fetch workspace')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspace()
  }, [user])

  return { workspaceId, loading, error }
}
