/* ==========================================================================
   EVOLIX — gallery.js
   Product Photography gallery: category filtering.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initGalleryFilters();
  });

  function initGalleryFilters() {
    var filters = document.querySelectorAll('.gallery__filter');
    var items = document.querySelectorAll('.gallery__item');
    if (!filters.length || !items.length) return;

    filters.forEach(function (filter) {
      filter.addEventListener('click', function () {
        var category = filter.getAttribute('data-filter');

        filters.forEach(function (f) {
          f.classList.remove('is-active');
          f.setAttribute('aria-selected', 'false');
        });
        filter.classList.add('is-active');
        filter.setAttribute('aria-selected', 'true');

        items.forEach(function (item) {
          var itemCategory = item.getAttribute('data-category');
          var match = category === 'all' || itemCategory === category;

          if (match) {
            item.style.display = '';
            item.removeAttribute('data-hidden');
            requestAnimationFrame(function () {
              item.style.opacity = '0';
              item.style.transform = 'scale(0.96)';
              requestAnimationFrame(function () {
                item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
              });
            });
          } else {
            item.setAttribute('data-hidden', 'true');
          }
        });
      });
    });
  }
})();
