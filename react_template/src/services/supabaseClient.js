import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test the Supabase connection
 * @returns {Promise<boolean>} Whether the connection was successful
 */
export const testSupabaseConnection = async () => {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('content_sources')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connected successfully!');
    return true;
  } catch (err) {
    console.error('Unexpected error connecting to Supabase:', err);
    return false;
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} The current user or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return null;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<boolean>} Whether the sign out was successful
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error signing out:', error);
    return false;
  }
};

export default supabase;