import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('social_accounts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return res.status(500).json({
        error: 'Supabase connection failed',
        details: error.message,
        code: error.code
      });
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test 2: Environment variables
    const envCheck = {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlLength: process.env.SUPABASE_URL?.length || 0,
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };
    
    console.log('📋 Environment check:', envCheck);
    
    return res.status(200).json({
      success: true,
      message: 'Supabase connection working',
      environment: envCheck,
      testData: data
    });
    
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
}
