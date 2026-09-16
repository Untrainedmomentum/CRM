const CONFIG = {
  SUPABASE_URL: 'https://lnxdvxqfmbajsajwymum.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueGR2eHFmbWJhanNhand5bXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjM1MTMsImV4cCI6MjA5NjMzOTUxM30.47CEA_di0Xhy_S2H7-bDtYNsUh9l5JQb2XWSV_RYO-Q',
  APP_NAME: 'Untrained Momentum CRM',
  APP_URL: 'https://hub.untrainedmomentum.com',
  FROM_EMAIL: 'info@untrainedmomentum.com',
  JOHN_EMAIL: 'johnnygoblue.79@gmail.com'
};

window.addEventListener('DOMContentLoaded', () => {
  const ext = document.createElement('script');
  ext.src = 'assets/js/crm-extensions.js?v=20260916-1';
  ext.defer = true;
  document.body.appendChild(ext);

  if (window.location.pathname.endsWith('social.html')) {
    const social = document.createElement('script');
    social.src = 'assets/js/social-oauth.js?v=20260916-1';
    social.defer = true;
    document.body.appendChild(social);
  }

  if (window.location.pathname.endsWith('bookings.html')) {
    const booking = document.createElement('script');
    booking.src = 'assets/js/booking-google.js?v=20260916-1';
    booking.defer = true;
    document.body.appendChild(booking);
  }
});
