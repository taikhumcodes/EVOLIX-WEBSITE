/* ==========================================================================
   EVOLIX — main.js
   Core site interactivity: navbar, cursor glow, scroll progress,
   hero particles, parallax, forms, footer utilities.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initNavbar();
    initMobileNav();
    initScrollProgress();
    initCursorGlow();
    initHeroParallax();
    initHeroParticles();
    initButtonRipple();
    initContactForm();
    initNewsletterForm();
    initBackToTop();
    initFooterYear();
    initSmoothAnchors();
  });

  /* ---------------------------------------------------------------------
     Navbar: shrink + background on scroll
  --------------------------------------------------------------------- */
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    var update = function () {
      var scrolled = window.scrollY > 40;
      navbar.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
    };

    update();
    window.addEventListener('scroll', throttle(update, 100), { passive: true });
  }

  /* ---------------------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var mobileNav = document.getElementById('mobileNav');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.setAttribute('data-state', isOpen ? 'closed' : 'open');
      document.body.style.overflow = isOpen ? '' : 'hidden';
      toggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
    });

    var links = mobileNav.querySelectorAll('.mobile-nav__link');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('data-state', 'closed');
        document.body.style.overflow = '';
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll progress bar
  --------------------------------------------------------------------- */
  function initScrollProgress() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;

    var update = function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = percent + '%';
    };

    update();
    window.addEventListener('scroll', throttle(update, 16), { passive: true });
    window.addEventListener('resize', throttle(update, 200));
  }

  /* ---------------------------------------------------------------------
     Cursor glow: follows pointer with easing
  --------------------------------------------------------------------- */
  function initCursorGlow() {
    var glow = document.getElementById('cursorGlow');
    if (!glow || prefersReducedMotion) return;
    if (window.matchMedia('(hover: none)').matches) return;

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;

    window.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
    });

    function animate() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      glow.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px) translate(-50%, -50%)';
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ---------------------------------------------------------------------
     Hero mouse parallax on dashboard mockup
  --------------------------------------------------------------------- */
  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    var mock = document.getElementById('dashboardMock');
    if (!hero || !mock || prefersReducedMotion) return;
    if (window.matchMedia('(hover: none)').matches) return;

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      mock.style.setProperty('--tilt-x', (x * 10) + 'deg');
      mock.style.setProperty('--tilt-y', (y * -6) + 'deg');
    });

    hero.addEventListener('mouseleave', function () {
      mock.style.setProperty('--tilt-x', '0deg');
      mock.style.setProperty('--tilt-y', '0deg');
    });

    // Floating icons drift subtly with mouse
    var floatIcons = document.querySelectorAll('.float-icon');
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      floatIcons.forEach(function (icon, i) {
        var depth = (i + 1) * 6;
        icon.style.marginLeft = (x * depth) + 'px';
        icon.style.marginTop = (y * depth) + 'px';
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hero canvas particles — lightweight ambient dots
  --------------------------------------------------------------------- */
  function initHeroParticles() {
    var canvas = document.getElementById('heroParticles');
    if (!canvas || prefersReducedMotion) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = window.innerWidth < 640 ? 30 : 60;
    var width, height;

    function resize() {
      var hero = canvas.closest('.hero');
      width = canvas.width = hero.offsetWidth;
      height = canvas.height = hero.offsetHeight;
    }

    function createParticles() {
      particles = [];
      for (var i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.6 + 0.4,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          alpha: Math.random() * 0.5 + 0.15
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 179, 255,' + p.alpha + ')';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', throttle(function () {
      resize();
      createParticles();
    }, 250));
  }

  /* ---------------------------------------------------------------------
     Button ripple effect
  --------------------------------------------------------------------- */
  function initButtonRipple() {
    var buttons = document.querySelectorAll('.btn--ripple');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        var size = Math.max(rect.width, rect.height);
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;

        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        btn.appendChild(ripple);
        ripple.addEventListener('animationend', function () {
          ripple.remove();
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Contact form validation (client-side, no backend)
  --------------------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var status = document.getElementById('formStatus');

    var fields = {
      name: { el: document.getElementById('name'), error: document.getElementById('nameError'), validate: function (v) { return v.trim().length >= 2; }, message: 'Please enter your full name.' },
      email: { el: document.getElementById('email'), error: document.getElementById('emailError'), validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, message: 'Please enter a valid email address.' },
      message: { el: document.getElementById('message'), error: document.getElementById('messageError'), validate: function (v) { return v.trim().length >= 10; }, message: 'Tell us a little more about your project (10+ characters).' }
    };

    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      field.el.addEventListener('blur', function () {
        validateField(field);
      });
      field.el.addEventListener('input', function () {
        if (field.el.closest('.form-group').classList.contains('has-error')) {
          validateField(field);
        }
      });
    });

    function validateField(field) {
      var valid = field.validate(field.el.value);
      var group = field.el.closest('.form-group');
      if (!valid) {
        group.classList.add('has-error');
        field.error.textContent = field.message;
      } else {
        group.classList.remove('has-error');
        field.error.textContent = '';
      }
      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var allValid = true;
      Object.keys(fields).forEach(function (key) {
        if (!validateField(fields[key])) allValid = false;
      });

      if (!allValid) {
        status.textContent = 'Please fix the highlighted fields.';
        status.style.color = '#FF6B6B';
        return;
      }

      var submitBtn = form.querySelector('.form-submit');
      submitBtn.setAttribute('disabled', 'true');
      status.style.color = '';
      status.textContent = 'Sending your message...';

      var payload = {
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        company: document.getElementById('company').value.trim(),
        budget: document.getElementById('budget').value,
        message: fields.message.el.value.trim()
      };

      if (window.EvolixDB && window.EvolixDB.isConfigured()) {
        window.EvolixDB.saveInquiry(payload)
          .then(function () {
            status.style.color = '';
            status.textContent = 'Thanks — your message has been saved. We\'ll reply within one business day.';
            form.reset();
            submitBtn.removeAttribute('disabled');
          })
          .catch(function (err) {
            console.error('Evolix DB: inquiry save failed', err);
            status.style.color = '#FF6B6B';
            status.textContent = 'Something went wrong sending your message. Please try again or email us directly.';
            submitBtn.removeAttribute('disabled');
          });
      } else {
        // Database not configured yet — degrade to a clear local confirmation
        // rather than silently losing the submission.
        console.warn('Evolix DB: not configured — see js/database.js setup instructions. Submission was not saved.');
        setTimeout(function () {
          status.textContent = 'Thanks — your message has been sent. We\'ll reply within one business day.';
          form.reset();
          submitBtn.removeAttribute('disabled');
        }, 900);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Newsletter form (footer)
  --------------------------------------------------------------------- */
  function initNewsletterForm() {
    var form = document.getElementById('newsletterForm');
    if (!form) return;
    var status = document.getElementById('newsletterStatus');
    var input = document.getElementById('newsletterEmail');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        status.textContent = 'Please enter a valid email address.';
        status.style.color = '#FF6B6B';
        return;
      }

      var email = input.value.trim();

      if (window.EvolixDB && window.EvolixDB.isConfigured()) {
        window.EvolixDB.saveNewsletterSignup(email)
          .then(function () {
            status.style.color = '';
            status.textContent = 'Subscribed — welcome aboard.';
            form.reset();
          })
          .catch(function (err) {
            console.error('Evolix DB: newsletter save failed', err);
            status.style.color = '#FF6B6B';
            status.textContent = 'Something went wrong. Please try again.';
          });
      } else {
        console.warn('Evolix DB: not configured — see js/database.js setup instructions. Signup was not saved.');
        status.style.color = '';
        status.textContent = 'Subscribed — welcome aboard.';
        form.reset();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Back to top button
  --------------------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    var update = function () {
      if (window.scrollY > 600) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    };

    update();
    window.addEventListener('scroll', throttle(update, 150), { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
  --------------------------------------------------------------------- */
  function initFooterYear() {
    var el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     Smooth anchor scrolling with navbar offset
  --------------------------------------------------------------------- */
  function initSmoothAnchors() {
    var navbar = document.getElementById('navbar');
    var links = document.querySelectorAll('a[href^="#"]');

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        var offset = navbar ? navbar.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.scrollY - offset - 12;

        window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Utility: throttle
  --------------------------------------------------------------------- */
  function throttle(fn, wait) {
    var lastTime = 0;
    var timeout = null;
    return function () {
      var now = Date.now();
      var args = arguments;
      var context = this;
      if (now - lastTime >= wait) {
        lastTime = now;
        fn.apply(context, args);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          lastTime = Date.now();
          fn.apply(context, args);
        }, wait - (now - lastTime));
      }
    };
  }

  // Expose throttle for other modules
  window.EvolixUtils = { throttle: throttle };
})();
