/* ==========================================================================
   EVOLIX — portal.js
   Unified "Manage Content" portal, lives on the Work page only.
   Lets any of the 3 partners (shared login) add, hide/show, and delete
   work items — directly on the page, no redirect, no separate admin page.

   Supports:
     - Multiple images per project
     - A category picker in the upload form (one of the 6 services)
     - Category filter tabs on the public grid
     - Deep-linking from a service page via ?category=xxx in the URL

   Depends on: js/database.js (loaded first, exposes window.EvolixDB.getClient)
   ========================================================================== */

(function () {
  'use strict';

  const CATEGORIES = [
    { value: 'all', label: 'All' },
    { value: 'website-development', label: 'Website Development' },
    { value: 'branding', label: 'Branding' },
    { value: 'amazon-aplus', label: 'Amazon A+ Content' },
    { value: 'product-photography', label: 'Product Photography' },
    { value: 'custom-software', label: 'Custom Software' },
    { value: 'digital-marketing', label: 'Digital Marketing' }
  ];
  const CATEGORY_LABELS = CATEGORIES.reduce(function (acc, c) { acc[c.value] = c.label; return acc; }, {});

  document.addEventListener('DOMContentLoaded', function () {
    const grid = document.querySelector('[data-portal-grid]');
    const manage = document.querySelector('[data-portal-manage]');
    if (!grid || !manage) return;

    const db = window.EvolixDB && window.EvolixDB.getClient();
    if (!db) {
      const section = grid.closest('.portal-section');
      if (section) section.hidden = true;
      manage.hidden = true;
      return; // not configured yet — section stays fully hidden, nothing breaks
    }

    initPortal(db, grid, manage);
  });

  function getUrlCategory() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    return CATEGORY_LABELS[cat] ? cat : 'all';
  }

  function initPortal(db, grid, manage) {
    const filterBar = document.querySelector('[data-portal-filters]');
    const trigger = manage.querySelector('.portal-manage__trigger');
    const loginBox = manage.querySelector('.portal-login');
    const uploadBox = manage.querySelector('.portal-upload');
    const emailInput = manage.querySelector('.portal-login__email');
    const passInput = manage.querySelector('.portal-login__password');
    const loginSubmit = manage.querySelector('.portal-login__submit');
    const loginError = manage.querySelector('.portal-login__error');
    const lockBtn = manage.querySelector('.portal-lock-btn');
    const form = manage.querySelector('.portal-upload__form');
    const uploadStatus = manage.querySelector('.portal-upload__status');

    let unlocked = false;
    let items = [];
    let activeFilter = getUrlCategory();

    buildFilterBar();

    db.auth.getSession().then(function (res) {
      unlocked = !!(res.data && res.data.session);
      setUnlockedUI(unlocked);
      loadItems();
    });

    trigger.addEventListener('click', function () {
      loginBox.hidden = !loginBox.hidden;
    });

    loginSubmit.addEventListener('click', function () {
      const email = emailInput.value.trim();
      const password = passInput.value;
      if (!email || !password) {
        loginError.textContent = 'Enter both email and password.';
        return;
      }
      loginSubmit.disabled = true;
      loginError.textContent = '';
      db.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
        loginSubmit.disabled = false;
        if (res.error) {
          loginError.textContent = 'Incorrect email or password.';
          return;
        }
        unlocked = true;
        passInput.value = '';
        setUnlockedUI(true);
        loadItems();
      });
    });

    lockBtn.addEventListener('click', function () {
      db.auth.signOut().then(function () {
        unlocked = false;
        setUnlockedUI(false);
        loadItems();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitNewItem();
    });

    function setUnlockedUI(isUnlocked) {
      trigger.hidden = isUnlocked;
      loginBox.hidden = true;
      uploadBox.hidden = !isUnlocked;
    }

    function buildFilterBar() {
      if (!filterBar) return;
      filterBar.innerHTML = CATEGORIES.map(function (c) {
        const active = c.value === activeFilter ? ' is-active' : '';
        return '<button class="gallery__filter' + active + '" data-filter="' + c.value + '" type="button">' + c.label + '</button>';
      }).join('');

      filterBar.querySelectorAll('.gallery__filter').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeFilter = btn.dataset.filter;
          filterBar.querySelectorAll('.gallery__filter').forEach(function (b) {
            b.classList.toggle('is-active', b === btn);
          });
          const url = new URL(window.location);
          if (activeFilter === 'all') url.searchParams.delete('category');
          else url.searchParams.set('category', activeFilter);
          window.history.replaceState({}, '', url);
          renderGrid();
        });
      });
    }

    function loadItems() {
      db.from('work_items').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
        .then(function (res) {
          if (res.error) {
            console.warn('Evolix Portal: failed to load items', res.error.message);
            return;
          }
          items = res.data || [];
          renderGrid();
        });
    }

    function visibleItems() {
      return items.filter(function (item) {
        return activeFilter === 'all' || item.category === activeFilter;
      });
    }

    function renderGrid() {
      const list = visibleItems();

      if (!list.length) {
        grid.innerHTML = unlocked
          ? '<p class="portal-empty">Nothing here yet — use the form below to add the first item' + (activeFilter !== 'all' ? ' in ' + CATEGORY_LABELS[activeFilter] : '') + '.</p>'
          : '<p class="portal-empty portal-empty--public">Nothing published in this category yet.</p>';
        return;
      }

      grid.innerHTML = list.map(function (item) {
        const images = Array.isArray(item.image_urls) ? item.image_urls : [];
        const hiddenBadge = item.is_hidden ? '<span class="portal-card__badge">Hidden from clients</span>' : '';
        const countBadge = images.length > 1 ? '<span class="portal-card__count">+' + (images.length - 1) + '</span>' : '';
        const categoryTag = '<span class="portal-card__category">' + escapeHtml(CATEGORY_LABELS[item.category] || item.category) + '</span>';

        const media = images.length
          ? '<img src="' + escapeAttr(images[0]) + '" alt="' + escapeAttr(item.title) + '" loading="lazy">'
          : '<div class="portal-card__media-placeholder">' + iconForItem(item) + '</div>';

        let linksHtml = '';
        if (item.file_url) {
          linksHtml += '<a href="' + escapeAttr(item.file_url) + '" target="_blank" rel="noopener" class="portal-card__link">' + escapeHtml(item.file_label || 'View file') + '</a>';
        }
        if (item.link_url) {
          linksHtml += '<a href="' + escapeAttr(item.link_url) + '" target="_blank" rel="noopener" class="portal-card__link">Visit link</a>';
        }

        let controlsHtml = '';
        if (unlocked) {
          controlsHtml =
            '<div class="portal-card__controls">' +
              '<button type="button" class="portal-card__btn" data-action="toggle-hide" data-id="' + item.id + '">' + (item.is_hidden ? 'Show' : 'Hide') + '</button>' +
              '<button type="button" class="portal-card__btn" data-action="edit" data-id="' + item.id + '">Edit</button>' +
              '<button type="button" class="portal-card__btn portal-card__btn--danger" data-action="delete" data-id="' + item.id + '">Delete</button>' +
            '</div>';
        }

        return (
          '<div class="portal-card' + (item.is_hidden ? ' portal-card--hidden' : '') + '" data-item-id="' + item.id + '" data-images=\'' + JSON.stringify(images).replace(/'/g, '&#39;') + '\'>' +
            '<div class="portal-card__media" data-action="' + (images.length ? 'view-images' : '') + '" data-id="' + item.id + '">' + media + countBadge + hiddenBadge + '</div>' +
            '<div class="portal-card__body">' +
              categoryTag +
              '<h3 class="portal-card__title">' + escapeHtml(item.title) + '</h3>' +
              (item.description ? '<p class="portal-card__desc">' + escapeHtml(item.description) + '</p>' : '') +
              (linksHtml ? '<div class="portal-card__links">' + linksHtml + '</div>' : '') +
            '</div>' +
            controlsHtml +
          '</div>'
        );
      }).join('');

      grid.querySelectorAll('[data-action]').forEach(function (el) {
        el.addEventListener('click', function () {
          const id = el.dataset.id;
          const action = el.dataset.action;
          if (action === 'toggle-hide') toggleHide(id);
          if (action === 'delete') deleteItem(id);
          if (action === 'edit') editItem(id);
          if (action === 'view-images') openLightbox(id);
        });
      });
    }

    function iconForItem(item) {
      if (item.file_url) return '📄';
      if (item.link_url) return '🔗';
      return '🖼️';
    }

    function openLightbox(id) {
      const card = grid.querySelector('.portal-card[data-item-id="' + id + '"]');
      if (!card) return;
      let images = [];
      try { images = JSON.parse(card.dataset.images.replace(/&#39;/g, "'")); } catch (e) { images = []; }
      if (images.length < 2) return; // single image already visible, no need for a lightbox

      let index = 0;
      const overlay = document.createElement('div');
      overlay.className = 'portal-lightbox';
      overlay.innerHTML =
        '<button class="portal-lightbox__close" type="button" aria-label="Close">&times;</button>' +
        '<button class="portal-lightbox__prev" type="button" aria-label="Previous">&larr;</button>' +
        '<img class="portal-lightbox__img" src="' + escapeAttr(images[0]) + '" alt="">' +
        '<button class="portal-lightbox__next" type="button" aria-label="Next">&rarr;</button>' +
        '<span class="portal-lightbox__count">1 / ' + images.length + '</span>';
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      const imgEl = overlay.querySelector('.portal-lightbox__img');
      const countEl = overlay.querySelector('.portal-lightbox__count');

      function show(i) {
        index = (i + images.length) % images.length;
        imgEl.src = images[index];
        countEl.textContent = (index + 1) + ' / ' + images.length;
      }
      overlay.querySelector('.portal-lightbox__prev').addEventListener('click', function () { show(index - 1); });
      overlay.querySelector('.portal-lightbox__next').addEventListener('click', function () { show(index + 1); });
      overlay.querySelector('.portal-lightbox__close').addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

      function close() {
        document.body.style.overflow = '';
        overlay.remove();
      }
    }

    function toggleHide(id) {
      const item = items.find(function (i) { return i.id === id; });
      if (!item) return;
      db.from('work_items').update({ is_hidden: !item.is_hidden }).eq('id', id).then(function (res) {
        if (res.error) { alert('Could not update: ' + res.error.message); return; }
        loadItems();
      });
    }

    function deleteItem(id) {
      if (!confirm('Delete this item? This cannot be undone.')) return;
      db.from('work_items').delete().eq('id', id).then(function (res) {
        if (res.error) { alert('Could not delete: ' + res.error.message); return; }
        loadItems();
      });
    }

    function editItem(id) {
      const item = items.find(function (i) { return i.id === id; });
      if (!item) return;
      const newTitle = prompt('Title:', item.title);
      if (newTitle === null) return;
      const newDesc = prompt('Description:', item.description || '');
      if (newDesc === null) return;
      db.from('work_items').update({ title: newTitle, description: newDesc }).eq('id', id).then(function (res) {
        if (res.error) { alert('Could not save: ' + res.error.message); return; }
        loadItems();
      });
    }

    function submitNewItem() {
      const categorySelect = form.querySelector('[name="category"]');
      const titleInput = form.querySelector('[name="title"]');
      const descInput = form.querySelector('[name="description"]');
      const imagesInput = form.querySelector('[name="images"]');
      const fileInput = form.querySelector('[name="file"]');
      const linkInput = form.querySelector('[name="link"]');
      const submitBtn = form.querySelector('button[type="submit"]');

      const category = categorySelect.value;
      const title = titleInput.value.trim();
      if (!category) {
        uploadStatus.style.color = '#FF6B6B';
        uploadStatus.textContent = 'Choose a category.';
        return;
      }
      if (!title) {
        uploadStatus.style.color = '#FF6B6B';
        uploadStatus.textContent = 'Title is required.';
        return;
      }

      submitBtn.disabled = true;
      uploadStatus.style.color = '';
      uploadStatus.textContent = 'Uploading...';

      const imageFiles = Array.from(imagesInput.files || []);
      const imageUploads = imageFiles.map(function (file) { return uploadFile(category, file); });

      let fileUrl = null;
      let fileLabel = null;
      const fileUploadPromise = fileInput.files[0]
        ? uploadFile(category, fileInput.files[0]).then(function (url) {
            fileUrl = url;
            fileLabel = fileInput.files[0].name;
          })
        : Promise.resolve();

      Promise.all([Promise.all(imageUploads), fileUploadPromise]).then(function (results) {
        const imageUrls = results[0];
        return db.from('work_items').insert([{
          category: category,
          title: title,
          description: descInput.value.trim() || null,
          image_urls: imageUrls,
          file_url: fileUrl,
          file_label: fileLabel,
          link_url: linkInput.value.trim() || null,
          is_hidden: false
        }]);
      }).then(function (res) {
        submitBtn.disabled = false;
        if (res.error) {
          uploadStatus.style.color = '#FF6B6B';
          uploadStatus.textContent = 'Could not save: ' + res.error.message;
          return;
        }
        uploadStatus.style.color = '';
        uploadStatus.textContent = 'Added.';
        form.reset();
        loadItems();
      }).catch(function (err) {
        submitBtn.disabled = false;
        uploadStatus.style.color = '#FF6B6B';
        uploadStatus.textContent = 'Upload failed: ' + err.message;
      });
    }

    function uploadFile(category, file) {
      const path = category + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      return db.storage.from('work-uploads').upload(path, file).then(function (res) {
        if (res.error) throw res.error;
        const pub = db.storage.from('work-uploads').getPublicUrl(path);
        return pub.data.publicUrl;
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }
})();
