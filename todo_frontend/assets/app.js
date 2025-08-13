(function () {
  const STORAGE_KEY = 'todos_figma_9_680';

  function $(sel, root = document) {
    return root.querySelector(sel);
  }
  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse todos from storage', e);
      return null;
    }
  }
  function saveTodos(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function seedIfEmpty() {
    let items = loadTodos();
    if (!items || !Array.isArray(items) || items.length === 0) {
      items = [
        { id: cryptoRandom(), title: 'TODO TITLE', detail: 'TODO SUB TITLE', completed: false },
        { id: cryptoRandom(), title: 'TODO TITLE', detail: 'TODO SUB TITLE', completed: false },
        { id: cryptoRandom(), title: 'TODO TITLE', detail: 'TODO SUB TITLE', completed: false },
        { id: cryptoRandom(), title: 'TODO TITLE', detail: 'TODO SUB TITLE', completed: false }
      ];
      saveTodos(items);
    }
    return items;
  }

  function cryptoRandom() {
    // Simple id generator
    return 'id-' + Math.random().toString(36).slice(2, 10);
  }

  function createIconSVGs() {
    // Returns SVG strings for pencil, trash, check to keep DOM creation simple
    const pencil =
      '<svg viewBox="0 0 25 25" aria-hidden="true">' +
      '<path d="M15.5 3.5 L21.5 9.5 L9 22 L3 22 L3 16 Z" class="icon-stroke"/>' +
      '<path d="M13.5 5.5 L19.5 11.5" class="icon-stroke"/>' +
      '</svg>';
    const trash =
      '<svg viewBox="0 0 25 25" aria-hidden="true">' +
      '<path d="M5 7 L20 7" class="icon-stroke"/>' +
      '<path d="M9 7 L9 5 L16 5 L16 7" class="icon-stroke"/>' +
      '<rect x="7" y="7" width="12" height="14" rx="1" class="icon-stroke" fill="none"/>' +
      '<path d="M11 11 L11 18 M15 11 L15 18" class="icon-stroke"/>' +
      '</svg>';
    const checkCircle =
      '<svg viewBox="0 0 25 25" aria-hidden="true">' +
      '<circle cx="12.5" cy="12.5" r="10" class="icon-stroke" />' +
      '<path d="M7.5 13 L11 16 L17.5 9" class="icon-stroke" />' +
      '</svg>';
    return { pencil, trash, checkCircle };
  }

  function cardTemplate(item) {
    const { pencil, trash, checkCircle } = createIconSVGs();
    const completedClass = item.completed ? ' completed' : '';
    return (
      '<article class="todo-card' + completedClass + '" data-id="' + item.id + '">' +
      '<h2 class="title">' + escapeHTML(item.title) + '</h2>' +
      '<p class="subtitle">' + escapeHTML(item.detail) + '</p>' +
      '<button class="icon-btn icon-pencil" data-action="edit" aria-label="Edit todo">' + pencil + '</button>' +
      '<button class="icon-btn icon-trash" data-action="delete" aria-label="Delete todo">' + trash + '</button>' +
      '<button class="icon-btn icon-check" data-action="toggle" aria-label="Toggle complete">' + checkCircle + '</button>' +
      '</article>'
    );
  }

  function renderTodos(filter = 'all') {
    const container = $('.todo-list');
    if (!container) return;
    const items = loadTodos() || seedIfEmpty();
    const filtered = items.filter(it => (filter === 'completed' ? it.completed : true));
    container.innerHTML = filtered.map(cardTemplate).join('');
  }

  function setFilterUI(filter) {
    $all('.bottom-nav .nav-item').forEach(btn => {
      const isSelected = btn.getAttribute('data-filter') === filter;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function handleListClick(e) {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    const card = btn.closest('.todo-card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    let items = loadTodos() || [];
    const idx = items.findIndex(it => it.id === id);
    if (idx === -1) return;

    if (action === 'toggle') {
      items[idx].completed = !items[idx].completed;
      saveTodos(items);
      // Re-render preserving current filter
      const selected = $('.bottom-nav .nav-item.selected');
      const filter = selected ? selected.getAttribute('data-filter') : 'all';
      renderTodos(filter);
    } else if (action === 'delete') {
      items.splice(idx, 1);
      saveTodos(items);
      const selected = $('.bottom-nav .nav-item.selected');
      const filter = selected ? selected.getAttribute('data-filter') : 'all';
      renderTodos(filter);
    } else if (action === 'edit') {
      // For now, just navigate to ADD_TODO with prefill via storage
      const editData = items[idx];
      sessionStorage.setItem('edit_todo', JSON.stringify(editData));
      window.location.href = './ADD_TODO.html';
    }
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initTodoPage() {
    seedIfEmpty();
    setFilterUI('all');
    renderTodos('all');

    // Filter buttons
    $all('.bottom-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        setFilterUI(filter);
        renderTodos(filter);
      });
    });

    // List interactions
    const list = $('.todo-list');
    if (list) {
      list.addEventListener('click', handleListClick);
    }

    // FAB to add screen
    const fab = $('#fab-add');
    if (fab) {
      fab.addEventListener('click', () => {
        sessionStorage.removeItem('edit_todo');
        window.location.href = './ADD_TODO.html';
      });
    }
  }

  function initAddPage() {
    const back = $('#btn-back');
    if (back) {
      back.addEventListener('click', () => {
        window.location.href = './TODO_PAGE.html';
      });
    }

    // Prefill if editing
    const editRaw = sessionStorage.getItem('edit_todo');
    let editingId = null;
    if (editRaw) {
      try {
        const editObj = JSON.parse(editRaw);
        if (editObj && editObj.id) {
          editingId = editObj.id;
          const title = $('#todo-title');
          const detail = $('#todo-detail');
          if (title) title.value = editObj.title || '';
          if (detail) detail.value = editObj.detail || '';
        }
      } catch {}
    }

    const addBtn = $('#btn-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const title = ($('#todo-title')?.value || '').trim();
        const detail = ($('#todo-detail')?.value || '').trim();
        if (!title && !detail) {
          // default to figma text
          addOrUpdateTodo('TODO TITLE', 'TODO SUB TITLE', editingId);
        } else {
          addOrUpdateTodo(title || 'TODO TITLE', detail || 'TODO SUB TITLE', editingId);
        }
        sessionStorage.removeItem('edit_todo');
        window.location.href = './TODO_PAGE.html';
      });
    }
  }

  function addOrUpdateTodo(title, detail, editingId) {
    let items = loadTodos() || [];
    if (editingId) {
      const idx = items.findIndex(it => it.id === editingId);
      if (idx !== -1) {
        items[idx].title = title;
        items[idx].detail = detail;
        saveTodos(items);
        return;
      }
    }
    const newItem = { id: cryptoRandom(), title, detail, completed: false };
    items.unshift(newItem); // add to top
    saveTodos(items);
  }

  // Entry
  document.addEventListener('DOMContentLoaded', () => {
    const screen = document.body.getAttribute('data-screen');
    if (screen === 'TODO_PAGE') initTodoPage();
    if (screen === 'ADD_TODO') initAddPage();
  });
})();
