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
      listEl.innerHTML = '<div class="w-full flex flex-col items-center justify-center gap-3 py-12 text-sm text-slate-500"><div class="w-8 h-8 rounded-full border-[3px] border-brand-100 border-t-brand-600 animate-spin"></div><span class="font-medium">Loading categories...</span></div>';
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
      listEl.innerHTML = '<div class="w-full px-4 py-12 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">No categories yet. Add one on the left.</div>';
      return;
    }
    listEl.innerHTML = '';
    cached.forEach(function(cat){
      var chip = document.createElement('div');
      chip.className = 'bp-category-chip group inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 bg-brand-50 border border-brand-100 rounded-full text-sm font-medium text-brand-800 hover:border-brand-300 hover:bg-brand-100 transition';

      var nameSpan = document.createElement('span');
      nameSpan.textContent = cat.name;

      var actions = document.createElement('div');
      actions.className = 'flex items-center gap-0.5';

      var editBtn = document.createElement('button');
      editBtn.className = 'text-brand-700/50 hover:text-brand-700 hover:bg-white rounded-full w-6 h-6 flex items-center justify-center transition';
      editBtn.title = 'Rename';
      editBtn.innerHTML = pencilSvg;
      editBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var newName = prompt('Rename category:', cat.name);
        if (!newName || newName.trim() === '' || newName.trim() === cat.name) return;
        api('update_category', { id: cat.id, name: newName.trim() }).then(function(r){
          if (r.success) { showToast('Category renamed'); loadCategories(); }
          else showToast(r.error || 'Rename failed');
        });
      });

      var delBtn = document.createElement('button');
      delBtn.className = 'text-brand-700/50 hover:text-red-600 hover:bg-white rounded-full w-6 h-6 flex items-center justify-center transition';
      delBtn.title = 'Delete';
      delBtn.innerHTML = trashSvg;
      delBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if (!confirm('Delete category "' + cat.name + '"? Paddles tagged with it will keep the tag in the sheet until you edit them.')) return;
        delBtn.disabled = true;
        delBtn.innerHTML = spinnerSvg;
        api('delete_category', { id: cat.id }).then(function(r){
          if (r.success) { showToast('Category deleted'); loadCategories(); }
          else { showToast(r.error || 'Delete failed'); delBtn.disabled = false; delBtn.innerHTML = trashSvg; }
        }).catch(function(){ showToast('Delete failed'); delBtn.disabled = false; delBtn.innerHTML = trashSvg; });
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      chip.appendChild(nameSpan);
      chip.appendChild(actions);
      listEl.appendChild(chip);
    });
  }

  addBtn.addEventListener('click', function(){
    var name = newInput.value.trim();
    if (!name) return;
    withSpinner(addBtn, 'Adding...', function(){
      return api('add_category', { name: name }).then(function(r){
        if (r.success) { newInput.value = ''; showToast('Category added'); loadCategories(); }
        else showToast(r.error || 'Add failed');
      }).catch(function(){ showToast('Add failed'); });
    });
  });
  newInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') addBtn.click(); });

  window.bpAdmin.onInit(function(){
    loadCategories();
  });
  window.bpAdmin.onTab('categories', function(){
    loadCategories();
  });

  return {
    getCategories: getCategories,
    reload: loadCategories
  };
})();
