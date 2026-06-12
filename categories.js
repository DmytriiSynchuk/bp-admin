// Category CRUD. Uses window.bpAdmin from app.js.

window.bpAdminCategories = (function(){
  var api = window.bpAdmin.api;
  var showToast = window.bpAdmin.showToast;
  var withSpinner = window.bpAdmin.withSpinner;
  var spinnerSvg = window.bpAdmin.spinnerSvg;

  var addBtn = document.getElementById('bp-category-add-btn');
  var newInput = document.getElementById('bp-new-category');
  var listEl = document.getElementById('bp-category-list');
  var countEl = document.getElementById('bp-category-count');

  var cached = [];

  function getCategories() { return cached.slice(); }

  var trashSvg = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>';
  var pencilSvg = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>';

  function loadCategories(silent) {
    if (!silent) {
      listEl.innerHTML = '<div class="px-4 py-8 text-center text-sm text-slate-500"><div class="inline-block w-6 h-6 rounded-full border-[3px] border-brand-100 border-t-brand-600 animate-spin"></div></div>';
    }
    return api('list_categories').then(function(res){
      if (!res.success) {
        listEl.innerHTML = '<div class="px-4 py-8 text-center text-sm text-red-500">' + (res.error || 'Failed to load') + '</div>';
        return;
      }
      cached = res.categories || [];
      renderList();
      if (window.bpAdminPaddles && window.bpAdminPaddles.refreshCategories) {
        window.bpAdminPaddles.refreshCategories();
      }
    });
  }

  function renderList() {
    countEl.textContent = '(' + cached.length + ')';
    if (cached.length === 0) {
      listEl.innerHTML = '<div class="px-4 py-8 text-center text-sm text-slate-400">No categories yet. Add one above.</div>';
      return;
    }
    listEl.innerHTML = '';
    cached.forEach(function(cat){
      var row = document.createElement('div');
      row.className = 'flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'text-sm font-medium text-slate-800';
      nameSpan.textContent = cat.name;

      var actions = document.createElement('div');
      actions.className = 'flex items-center gap-1';

      var editBtn = document.createElement('button');
      editBtn.className = 'text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md w-7 h-7 flex items-center justify-center transition';
      editBtn.title = 'Rename';
      editBtn.innerHTML = pencilSvg;
      editBtn.addEventListener('click', function(){
        var newName = prompt('Rename category:', cat.name);
        if (!newName || newName.trim() === '' || newName.trim() === cat.name) return;
        api('update_category', { id: cat.id, name: newName.trim() }).then(function(r){
          if (r.success) { showToast('Category renamed'); loadCategories(true); }
          else showToast(r.error || 'Rename failed');
        });
      });

      var delBtn = document.createElement('button');
      delBtn.className = 'text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md w-7 h-7 flex items-center justify-center transition';
      delBtn.title = 'Delete';
      delBtn.innerHTML = trashSvg;
      delBtn.addEventListener('click', function(){
        if (!confirm('Delete category "' + cat.name + '"? Paddles tagged with it will keep the tag in the sheet until you edit them.')) return;
        delBtn.disabled = true;
        delBtn.innerHTML = spinnerSvg;
        api('delete_category', { id: cat.id }).then(function(r){
          if (r.success) { showToast('Category deleted'); loadCategories(true); }
          else { showToast(r.error || 'Delete failed'); delBtn.disabled = false; delBtn.innerHTML = trashSvg; }
        }).catch(function(){ showToast('Delete failed'); delBtn.disabled = false; delBtn.innerHTML = trashSvg; });
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      row.appendChild(nameSpan);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
  }

  addBtn.addEventListener('click', function(){
    var name = newInput.value.trim();
    if (!name) return;
    withSpinner(addBtn, 'Adding...', function(){
      return api('add_category', { name: name }).then(function(r){
        if (r.success) { newInput.value = ''; showToast('Category added'); loadCategories(true); }
        else showToast(r.error || 'Add failed');
      }).catch(function(){ showToast('Add failed'); });
    });
  });
  newInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') addBtn.click(); });

  window.bpAdmin.onInit(function(){
    loadCategories();
  });
  window.bpAdmin.onTab('categories', function(){
    loadCategories(true);
  });

  return {
    getCategories: getCategories,
    reload: loadCategories
  };
})();
