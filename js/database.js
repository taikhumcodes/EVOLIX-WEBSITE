/* ==========================================================================
   EVOLIX — database.js
   Connects the site to a Supabase (Postgres) backend to:
     1. Log every page visit (page_visits table)
     2. Store every "Start a Project" contact form submission (project_inquiries table)

   SETUP REQUIRED:
   1. Create a free project at https://supabase.com
   2. Run the SQL in /supabase/schema.sql (included alongside this file) in the
      Supabase SQL editor to create the two tables + security policies.
   3. In Supabase: Project Settings → API → copy your "Project URL" and
      "anon public" key, then paste them below.
   4. This file depends on the Supabase JS client loaded via CDN in index.html
      (see the <script> tag for @supabase/supabase-js right before this file).

   SECURITY NOTE:
   The "anon public" key is safe to expose in client-side code — it is
   designed for this. Row Level Security (RLS) policies (in schema.sql)
   allow this key to INSERT rows only. It cannot read, update, or delete
   any data. You view submissions/visits from the Supabase dashboard
   (Table Editor), which uses your private login, not this key.
   ========================================================================== */

(function () {
  'use strict';

  // ---- 1. Paste your Supabase project credentials here ----
  var SUPABASE_URL = 'https://volwwfndefvmptxvrutg.supabase.co'; // e.g. https://xyzcompany.supabase.co
  var SUPABASE_ANON_KEY = 'sb_publishable_B4DOOEe1FWb0bVRBAbMCrQ_Yq2xen4Z';

  var client = null;

  function getClient() {
    if (client) return client;
    if (
      typeof window.supabase === 'undefined' ||
      SUPABASE_URL.indexOf('YOUR_SUPABASE') === 0 ||
      SUPABASE_ANON_KEY.indexOf('YOUR_SUPABASE') === 0
    ) {
      return null; // not configured yet — fail silently, site still works
    }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }

  /* ---------------------------------------------------------------------
     Visit logging — fires once per page load
  --------------------------------------------------------------------- */
  function logVisit() {
    var db = getClient();
    if (!db) return;

    db.from('page_visits')
      .insert([{
        page_path: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        session_id: getSessionId(),
        landing_source: window.location.search || null
      }])
      .then(function (res) {
        if (res.error) console.warn('Evolix DB: visit log failed', res.error.message);
      });
  }

  /* ---------------------------------------------------------------------
     Session id — groups multiple page views from the same browser tab
     without identifying the person; cleared when the browser tab closes.
  --------------------------------------------------------------------- */
  function getSessionId() {
    var key = 'evolix_session_id';
    try {
      var id = sessionStorage.getItem(key);
      if (!id) {
        id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      return null; // storage blocked (private mode etc.) — degrade gracefully
    }
  }

  /* ---------------------------------------------------------------------
     Save a "Start a Project" contact form inquiry
     Returns a Promise so main.js can react to success/failure.
  --------------------------------------------------------------------- */
  function saveInquiry(data) {
    var db = getClient();
    if (!db) {
      return Promise.reject(new Error('Database not configured yet.'));
    }

    return db.from('project_inquiries').insert([{
      name: data.name,
      email: data.email,
      company: data.company || null,
      budget: data.budget || null,
      message: data.message,
      source_path: window.location.pathname,
      session_id: getSessionId()
    }]).then(function (res) {
      if (res.error) throw res.error;
      return res;
    });
  }

  /* ---------------------------------------------------------------------
     Save a newsletter signup
  --------------------------------------------------------------------- */
  function saveNewsletterSignup(email) {
    var db = getClient();
    if (!db) {
      return Promise.reject(new Error('Database not configured yet.'));
    }

    return db.from('newsletter_signups').insert([{
      email: email,
      session_id: getSessionId()
    }]).then(function (res) {
      if (res.error) throw res.error;
      return res;
    });
  }

  document.addEventListener('DOMContentLoaded', logVisit);

  // Expose a small public API for main.js to use
  window.EvolixDB = {
    saveInquiry: saveInquiry,
    saveNewsletterSignup: saveNewsletterSignup,
    isConfigured: function () { return !!getClient(); }
  };
})();
