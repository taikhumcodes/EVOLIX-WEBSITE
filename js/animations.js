/* ==========================================================================
   EVOLIX — animations.js
   Scroll reveals, animated counters, card tilt, testimonials slider,
   FAQ accordion, process timeline trigger.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initScrollReveal();
    initCounters();
    initCardTilt();
    initTestimonialsSlider();
    initFaqAccordion();
  });

  /* ---------------------------------------------------------------------
     Scroll reveal via IntersectionObserver
  --------------------------------------------------------------------- */
  function initScrollReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }

    items.forEach(function (item) {
      var delay = item.getAttribute('data-reveal-delay');
      if (delay) item.style.setProperty('--reveal-delay', delay + 'ms');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (item) { observer.observe(item); });
  }

  /* ---------------------------------------------------------------------
     Animated counters (hero stats, why-evolix counters)
  --------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) { observer.observe(counter); });

    function runCounter(el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = prefersReducedMotion ? 0 : 1600;
      var startTime = null;

      if (duration === 0) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        var value = target * eased;
        el.textContent = prefix + value.toFixed(decimals) + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
          el.classList.add('is-counting');
        }
      }

      requestAnimationFrame(step);
    }
  }

  /* ---------------------------------------------------------------------
     Card tilt on mouse move (service cards, why cards)
  --------------------------------------------------------------------- */
  function initCardTilt() {
    if (prefersReducedMotion) return;
    if (window.matchMedia('(hover: none)').matches) return;

    var cards = document.querySelectorAll('.service-card, .why-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--rx', (x * 6) + 'deg');
        card.style.setProperty('--ry', (y * -6) + 'deg');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Testimonials auto slider
  --------------------------------------------------------------------- */
  function initTestimonialsSlider() {
    var track = document.getElementById('testimonialsTrack');
    var dotsWrap = document.getElementById('testimonialDots');
    var prevBtn = document.getElementById('testimonialPrev');
    var nextBtn = document.getElementById('testimonialNext');
    if (!track || !dotsWrap) return;

    var slides = track.querySelectorAll('.testimonial-card');
    var current = 0;
    var autoplayDelay = 6000;
    var autoplayTimer = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'testimonials__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', function () {
        goTo(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
    });

    var dots = dotsWrap.querySelectorAll('.testimonials__dot');

    function update() {
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      slides.forEach(function (slide, i) {
        slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
        dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      update();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      autoplayTimer = setInterval(next, autoplayDelay);
    }
    function stopAutoplay() {
      clearInterval(autoplayTimer);
    }
    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restartAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restartAutoplay(); });

    var slider = document.getElementById('testimonialsSlider');
    if (slider) {
      slider.addEventListener('mouseenter', stopAutoplay);
      slider.addEventListener('mouseleave', startAutoplay);
    }

    // Basic touch swipe support
    var touchStartX = 0;
    track.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      stopAutoplay();
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var delta = e.changedTouches[0].clientX - touchStartX;
      if (delta > 50) prev();
      else if (delta < -50) next();
      startAutoplay();
    }, { passive: true });

    update();
    startAutoplay();
  }

  /* ---------------------------------------------------------------------
     FAQ accordion
  --------------------------------------------------------------------- */
  function initFaqAccordion() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var trigger = item.querySelector('.faq-item__trigger');
      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        items.forEach(function (other) {
          other.classList.remove('is-open');
          var otherTrigger = other.querySelector('.faq-item__trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
})();
