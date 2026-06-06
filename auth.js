// assets/js/auth.js
// Handles login, logout, session checks, and role-based routing

const Auth = {

  // Get current session
  async getSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
  },

  // Get current user profile (includes role)
  async getProfile() {
    const session = await this.getSession();
    if (!session) return null;
    const { data, error } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (error) return null;
    return data;
  },

  // Login with email and password
  async login(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Logout
  async logout() {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
  },

  // Require login — redirect to index if not authenticated
  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    return session;
  },

  // Require admin role
  async requireAdmin() {
    const profile = await this.getProfile();
    if (!profile || profile.role !== 'admin') {
      window.location.href = 'index.html';
      return null;
    }
    return profile;
  },

  // Route user to correct dashboard based on role
  async routeByRole() {
    const profile = await this.getProfile();
    if (!profile) {
      window.location.href = 'index.html';
      return;
    }
    if (profile.role === 'admin') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'john.html';
    }
  },

  // Render nav user info
  async renderUserInfo(elementId) {
    const profile = await this.getProfile();
    const el = document.getElementById(elementId);
    if (el && profile) {
      el.innerHTML = `
        <span class="nav-user-name">${profile.full_name || profile.email}</span>
        <span class="nav-user-role">${profile.role}</span>
      `;
    }
    return profile;
  }
};
