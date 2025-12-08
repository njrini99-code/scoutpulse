import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        environment: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
        },
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      tests: {},
      success: true,
      errors: [],
    };

    // Test 1: Check profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      results.tests.profiles = {
        accessible: !error,
        error: error?.message || null,
      };
      
      if (error) {
        results.success = false;
        results.errors.push(`Profiles: ${error.message}`);
      }
    } catch (e: any) {
      results.tests.profiles = { accessible: false, error: e.message };
      results.success = false;
      results.errors.push(`Profiles: ${e.message}`);
    }

    // Test 2: Check players table
    try {
      const { data, error } = await supabase
        .from('players')
        .select('count')
        .limit(1);
      
      results.tests.players = {
        accessible: !error,
        error: error?.message || null,
      };
      
      if (error) {
        results.success = false;
        results.errors.push(`Players: ${error.message}`);
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      results.tests.players = { accessible: false, error: error.message };
      results.success = false;
      results.errors.push(`Players: ${error.message}`);
    }

    // Test 3: Check coaches table
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('count')
        .limit(1);
      
      results.tests.coaches = {
        accessible: !error,
        error: error?.message || null,
      };
      
      if (error) {
        results.success = false;
        results.errors.push(`Coaches: ${error.message}`);
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      results.tests.coaches = { accessible: false, error: error.message };
      results.success = false;
      results.errors.push(`Coaches: ${error.message}`);
    }

    // Test 4: Check get_state_counts function
    try {
      const { data, error } = await supabase.rpc('get_state_counts');
      
      results.tests.get_state_counts = {
        accessible: !error,
        error: error?.message || null,
        resultCount: data?.length || 0,
      };
      
      if (error) {
        results.success = false;
        results.errors.push(`get_state_counts: ${error.message}`);
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      results.tests.get_state_counts = { accessible: false, error: error.message };
      results.success = false;
      results.errors.push(`get_state_counts: ${error.message}`);
    }

    // Test 5: Check other important tables
    const otherTables = ['camp_events', 'teams', 'recruits', 'player_metrics'];
    for (const table of otherTables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        results.tests[table] = {
          accessible: !error,
          error: error?.message || null,
        };
        if (error) {
          results.success = false;
          results.errors.push(`${table}: ${error.message}`);
        }
      } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error(String(e));
        results.tests[table] = { accessible: false, error: error.message };
        results.success = false;
        results.errors.push(`${table}: ${error.message}`);
      }
    }

    // Test 6: Check environment variables
    results.environment = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'missing',
    };

    return NextResponse.json(results, { 
      status: results.success ? 200 : 500 
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

