-- Create default Sales Pipeline with all required stages
-- This ensures every workspace has a proper pipeline structure

-- First, ensure we have a default pipeline for each workspace
-- This function will be called for existing workspaces
DO $$
DECLARE
    workspace_record RECORD;
    pipeline_id_var UUID;
    stage_position INTEGER := 0;
BEGIN
    -- Loop through all workspaces
    FOR workspace_record IN SELECT id FROM public.workspaces LOOP
        -- Check if default pipeline exists
        SELECT id INTO pipeline_id_var
        FROM public.pipelines
        WHERE workspace_id = workspace_record.id
        AND is_default = TRUE
        LIMIT 1;
        
        -- If no default pipeline exists, create one
        IF pipeline_id_var IS NULL THEN
            INSERT INTO public.pipelines (workspace_id, name, description, is_default, type, position)
            VALUES (
                workspace_record.id,
                'Sales Pipeline',
                'Default sales pipeline for managing deals from lead to conversion',
                TRUE,
                'sales',
                0
            )
            RETURNING id INTO pipeline_id_var;
        END IF;
        
        -- Now ensure all required stages exist for this pipeline
        -- Stage 1: Lead (10% probability)
        IF NOT EXISTS (
            SELECT 1 FROM public.pipeline_stages 
            WHERE pipeline_id = pipeline_id_var AND name = 'Lead'
        ) THEN
            INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost)
            VALUES (pipeline_id_var, 'Lead', 'Created from campaigns or social. Usually unqualified.', 10, stage_position, FALSE, FALSE);
            stage_position := stage_position + 1;
        END IF;
        
        -- Stage 2: Contacted (20% probability)
        IF NOT EXISTS (
            SELECT 1 FROM public.pipeline_stages 
            WHERE pipeline_id = pipeline_id_var AND name = 'Contacted'
        ) THEN
            INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost)
            VALUES (pipeline_id_var, 'Contacted', 'First message sent. Waiting response.', 20, stage_position, FALSE, FALSE);
            stage_position := stage_position + 1;
        END IF;
        
        -- Stage 3: Engaged (40% probability)
        IF NOT EXISTS (
            SELECT 1 FROM public.pipeline_stages 
            WHERE pipeline_id = pipeline_id_var AND name = 'Engaged'
        ) THEN
            INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost)
            VALUES (pipeline_id_var, 'Engaged', 'Customer replied. Interest confirmed.', 40, stage_position, FALSE, FALSE);
            stage_position := stage_position + 1;
        END IF;
        
        -- Stage 4: Proposal (60% probability)
        IF NOT EXISTS (
            SELECT 1 FROM public.pipeline_stages 
            WHERE pipeline_id = pipeline_id_var AND name = 'Proposal'
        ) THEN
            INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost)
            VALUES (pipeline_id_var, 'Proposal', 'Quotation sent.', 60, stage_position, FALSE, FALSE);
            stage_position := stage_position + 1;
        END IF;
        
        -- Stage 5: Negotiation (80% probability)
        IF NOT EXISTS (
            SELECT 1 FROM public.pipeline_stages 
            WHERE pipeline_id = pipeline_id_var AND name = 'Negotiation'
        ) THEN
            INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost)
            VALUES (pipeline_id_var, 'Negotiation', 'Price discussion.', 80, stage_position, FALSE, FALSE);
            stage_position := stage_position + 1;
        END IF;
        
        -- Stage 6: Won (100% probability, closed won)
        IF NOT EXISTS (
            SELECT 1 FROM public.pipeline_stages 
            WHERE pipeline_id = pipeline_id_var AND name = 'Won'
        ) THEN
            INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost)
            VALUES (pipeline_id_var, 'Won', 'Converted.', 100, stage_position, TRUE, FALSE);
            stage_position := stage_position + 1;
        END IF;
        
        -- Stage 7: Lost (0% probability, closed lost)
        IF NOT EXISTS (
            SELECT 1 FROM public.pipeline_stages 
            WHERE pipeline_id = pipeline_id_var AND name = 'Lost'
        ) THEN
            INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost)
            VALUES (pipeline_id_var, 'Lost', 'Failed (with reason).', 0, stage_position, FALSE, TRUE);
            stage_position := stage_position + 1;
        END IF;
        
        -- Reset position for next workspace
        stage_position := 0;
    END LOOP;
END $$;

-- Also create a function to auto-create pipeline for new workspaces
CREATE OR REPLACE FUNCTION create_default_pipeline_for_workspace()
RETURNS TRIGGER AS $$
DECLARE
    new_pipeline_id UUID;
    stage_position INTEGER := 0;
BEGIN
    -- Create default pipeline
    INSERT INTO public.pipelines (workspace_id, name, description, is_default, type, position)
    VALUES (
        NEW.id,
        'Sales Pipeline',
        'Default sales pipeline for managing deals from lead to conversion',
        TRUE,
        'sales',
        0
    )
    RETURNING id INTO new_pipeline_id;
    
    -- Create all stages
    INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Lead', 'Created from campaigns or social. Usually unqualified.', 10, stage_position, FALSE, FALSE);
    stage_position := stage_position + 1;
    
    INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Contacted', 'First message sent. Waiting response.', 20, stage_position, FALSE, FALSE);
    stage_position := stage_position + 1;
    
    INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Engaged', 'Customer replied. Interest confirmed.', 40, stage_position, FALSE, FALSE);
    stage_position := stage_position + 1;
    
    INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Proposal', 'Quotation sent.', 60, stage_position, FALSE, FALSE);
    stage_position := stage_position + 1;
    
    INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Negotiation', 'Price discussion.', 80, stage_position, FALSE, FALSE);
    stage_position := stage_position + 1;
    
    INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Won', 'Converted.', 100, stage_position, TRUE, FALSE);
    stage_position := stage_position + 1;
    
    INSERT INTO public.pipeline_stages (pipeline_id, name, description, probability, position, is_closed_won, is_closed_lost) VALUES
    (new_pipeline_id, 'Lost', 'Failed (with reason).', 0, stage_position, FALSE, TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create pipeline when workspace is created
DROP TRIGGER IF EXISTS trigger_create_default_pipeline ON public.workspaces;
CREATE TRIGGER trigger_create_default_pipeline
    AFTER INSERT ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION create_default_pipeline_for_workspace();
