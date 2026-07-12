/* ==========================================================================
   EVOLIX — portal.js
   Inline "Manage Content" portal. Lets any of the 3 partners (shared login)
   add, hide/show, and delete work items directly on the public page —
   no separate admin page, no redirect.

   Depends on: js/database.js (loaded first, exposes window.EvolixDB.getClient)
   Requires a <div data-portal-category="..."> grid and a matching
   <div data-portal-manage="..."> control block to already exist in the page.
   ========================================================================== */

(function () {
  'use strict';

  const CATEGORY_LABELS = {
    'work': 'Work',
    'photography': 'Product Photography',
    'amazon-aplus': 'Amazon A+ Content',
    'custom-software': 'Custom Software'
  };

  document.addEventListener('DOMContentLoaded', function () {
    const grids = document.querySelectorAll('[data-portal-category]');
    if (!grids.length) return;

    const db = window.EvolixDB && window.EvolixDB.getClient();
    if (!db) {
      grids.forEach(function (grid) {
        grid.innerHTML = '';
        const section = grid.closest('.portal-section');
        if (section) section.hidden = true;
      });
      document.querySelectorAll('[data-portal-manage]').forEach(function (el) {
        el.hidden = true;
      });
      return; // not configured yet — sections simply stay empty, nothing breaks
    }

    grids.forEach(function (grid) {
      initPortalSection(db, grid.dataset.portalCategory);
    });
  });

  function initPortalSection(db, category) {
    const grid = document.querySelector('[data-portal-category="' + category + '"]');
    const manage = document.querySelector('[data-portal-manage="' + category + '"]');
    if (!grid || !manage) return;

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

    // ---- Session check on load ----
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

    function loadItems() {
      let query = db.from('work_items').select('*').eq('category', category).order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      query.then(function (res) {
        if (res.error) {
          console.warn('Evolix Portal: failed to load items', res.error.message);
          return;
        }
        items = res.data || [];
        renderGrid();
      });
    }

    function renderGrid() {
      if (!items.length) {
        grid.innerHTML = unlocked
          ? '<p class="portal-empty">Nothing added yet — use the form below to add the first item.</p>'
          : '';
        return;
      }

      grid.innerHTML = items.map(function (item) {
        const hiddenBadge = item.is_hidden ? '<span class="portal-card__badge">Hidden from clients</span>' : '';
        const media = item.image_url
          ? '<img src="' + escapeAttr(item.image_url) + '" alt="' + escapeAttr(item.title) + '" loading="lazy">'
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
          '<div class="portal-card' + (item.is_hidden ? ' portal-card--hidden' : '') + '" data-item-id="' + item.id + '">' +
            '<div class="portal-card__media">' + media + hiddenBadge + '</div>' +
            '<div class="portal-card__body">' +
              '<h3 class="portal-card__title">' + escapeHtml(item.title) + '</h3>' +
              (item.description ? '<p class="portal-card__desc">' + escapeHtml(item.description) + '</p>' : '') +
              (linksHtml ? '<div class="portal-card__links">' + linksHtml + '</div>' : '') +
            '</div>' +
            controlsHtml +
          '</div>'
        );
      }).join('');

      grid.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === 'toggle-hide') toggleHide(id);
          if (action === 'delete') deleteItem(id);
          if (action === 'edit') editItem(id);
        });
      });
    }

    function iconForItem(item) {
      if (item.file_url) return '📄';
      if (item.link_url) return '🔗';
      return '🖼️';
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
      const titleInput = form.querySelector('[name="title"]');
      const descInput = form.querySelector('[name="description"]');
      const imageInput = form.querySelector('[name="image"]');
      const fileInput = form.querySelector('[name="file"]');
      const linkInput = form.querySelector('[name="link"]');
      const submitBtn = form.querySelector('button[type="submit"]');

      const title = titleInput.value.trim();
      if (!title) {
        uploadStatus.textContent = 'Title is required.';
        uploadStatus.style.color = '#FF6B6B';
        return;
      }

      submitBtn.disabled = true;
      uploadStatus.style.color = '';
      uploadStatus.textContent = 'Uploading...';

      const uploads = [];
      let imageUrl = null;
      let fileUrl = null;
      let fileLabel = null;

      if (imageInput.files[0]) {
        uploads.push(uploadFile(imageInput.files[0]).then(function (url) { imageUrl = url; }));
      }
      if (fileInput.files[0]) {
        fileLabel = fileInput.files[0].name;
        uploads.push(uploadFile(fileInput.files[0]).then(function (url) { fileUrl = url; }));
      }

      Promise.all(uploads).then(function () {
        return db.from('work_items').insert([{
          category: category,
          title: title,
          description: descInput.value.trim() || null,
          image_url: imageUrl,
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

    function uploadFile(file) {
      const path = category + '/' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
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
