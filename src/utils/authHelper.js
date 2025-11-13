import { supabase } from '../lib/supabase';

export const authHelper = {
  // Check if user is authenticated
  async checkAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth check error:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Auth check failed:', error);
      return null;
    }
  },

  // Get current user session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('Session check failed:', error);
      return null;
    }
  },

  // Sign in anonymously (for testing)
  async signInAnonymously() {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Anonymous sign in error:', error);
        return null;
      }
      console.log('Signed in anonymously:', data);
      return data;
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      return null;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Sign out failed:', error);
      return false;
    }
  }
};
