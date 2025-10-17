// ===== Selectors =====
const toDoInput = document.getElementById('todo-input');
const toDoForm = document.getElementById('todo-form');
const toDoList = document.getElementById('todo-list');
const personSelect = document.getElementById('person-select');
const addReminderBtn = document.getElementById('save-reminder');

const standardTheme = document.querySelector('.standard-theme');
const lightTheme = document.querySelector('.light-theme');
const darkerTheme = document.querySelector('.darker-theme');

const progressBarFill = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');

const reminderText = document.getElementById('reminder-text');
const reminderTime = document.getElementById('reminder-time');
const reminderList = document.getElementById('reminder-list');

const celebrationSound = document.getElementById('celebration-sound');
const reminderSound = new Audio("assets/alert.mp3");

// ===== Storage Keys =====
const TODOS_KEY = 'memo-dodo-todos-v1';
const REMINDERS_KEY = 'memo-dodo-reminders-v2';
const THEME_KEY = 'savedTheme';

// ===== Theme setup =====
let savedTheme = localStorage.getItem(THEME_KEY) || 'standard';
changeTheme(savedTheme);

// ===== Confetti Effect =====
function showConfetti() {
  const count = 40;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = (10 + Math.random() * 80) + '%';
    c.style.background = ['#ff6263', '#ffd166', '#4ecdc4', '#6a4c93', '#ff9a9e'][Math.floor(Math.random() * 5)];
    document.body.appendChild(c);
    c.animate([
      { transform: 'translateY(-10vh)', opacity: 1 },
      { transform: 'translateY(80vh) rotate(360deg)', opacity: 0.1 }
    ], { duration: 1800 + Math.random() * 800, easing: 'ease-out' });
    setTimeout(() => c.remove(), 2500);
  }
}

// ===== Add Task =====
toDoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = toDoInput.value.trim();
  const person = personSelect.value;
  const date = new Date().toLocaleDateString();

  if (!text) return alert('Please write a task.');

  const todo = { id: Date.now().toString(), text, person, completed: false, date };
  saveTodosPush(todo);
  renderTodoElement(todo);
  toDoInput.value = '';
  updateProgress();
});

function renderTodoElement(todo) {
  const div = document.createElement('div');
  div.className = `todo ${savedTheme}-todo`;
  if (todo.completed) div.classList.add('completed');
  div.dataset.id = todo.id;
  div.dataset.person = todo.person;

  const li = document.createElement('li');
  li.className = 'todo-item';
  li.innerHTML = `<strong>${todo.text}</strong><br><small>${todo.date}</small>`;
  div.appendChild(li);

  const checkBtn = document.createElement('button');
  checkBtn.className = `check-btn ${savedTheme}-button`;
  checkBtn.innerHTML = '<i class="fas fa-check"></i>';
  div.appendChild(checkBtn);

  const delBtn = document.createElement('button');
  delBtn.className = `delete-btn ${savedTheme}-button`;
  delBtn.innerHTML = '<i class="fas fa-trash"></i>';
  div.appendChild(delBtn);

  toDoList.prepend(div);
}

// ===== Delete / Complete =====
toDoList.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target) return;
  const parent = target.parentElement;
  const id = parent.dataset.id;

  if (target.classList.contains('delete-btn')) {
    parent.remove();
    removeTodoById(id);
    updateProgress();
  }

  if (target.classList.contains('check-btn')) {
    const todos = getTodosArray();
    const idx = todos.findIndex(t => t.id === id);
    if (idx > -1) {
      todos[idx].completed = !todos[idx].completed;
      localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
      if (todos[idx].completed) {
        parent.classList.add('completed');
        celebrationSound.play();
        showConfetti();
      } else {
        parent.classList.remove('completed');
      }
      updateProgress();
    }
  }
});

// ===== Storage Helpers =====
function getTodosArray() {
  return JSON.parse(localStorage.getItem(TODOS_KEY) || '[]');
}
function saveTodosPush(todo) {
  const arr = getTodosArray();
  arr.push(todo);
  localStorage.setItem(TODOS_KEY, JSON.stringify(arr));
}
function removeTodoById(id) {
  let arr = getTodosArray().filter(t => t.id !== id);
  localStorage.setItem(TODOS_KEY, JSON.stringify(arr));
}

// ===== Reminders =====
addReminderBtn.addEventListener('click', () => {
  const title = reminderText.value.trim();
  const dt = reminderTime.value;
  if (!title || !dt) return alert('Please enter title and time.');

  const reminder = { id: Date.now().toString(), title, datetime: dt, done: false };
  const arr = getRemindersArray();
  arr.push(reminder);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(arr));
  reminderText.value = '';
  reminderTime.value = '';
  renderRemindersList();
});

function getRemindersArray() {
  return JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
}

function renderRemindersList() {
  reminderList.innerHTML = '';
  const arr = getRemindersArray().sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  arr.forEach(r => {
    const li = document.createElement('li');
    li.className = 'reminder-item';
    li.dataset.id = r.id;
    li.innerHTML = `
      <span class="r-title">${r.title}</span>
      <span class="r-time">${new Date(r.datetime).toLocaleString()}</span>
      <button class="delete-reminder ${savedTheme}-button">Delete</button>`;
    reminderList.appendChild(li);
  });
}

reminderList.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-reminder')) {
    const id = e.target.closest('li').dataset.id;
    deleteReminderById(id);
    renderRemindersList();
  }
});

function deleteReminderById(id) {
  let arr = getRemindersArray().filter(r => r.id !== id);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(arr));
}

// ===== Reminder Notifications & Sound =====
function notifyUser(title) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("⏰ Reminder!", { body: title, icon: "assets/bell.png" });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification("⏰ Reminder!", { body: title, icon: "assets/bell.png" });
        }
      });
    }
  }
  reminderSound.play();
}

function checkReminders() {
  const arr = getRemindersArray();
  const now = new Date();

  arr.forEach(r => {
    const rTime = new Date(r.datetime);
    if (!r.done && rTime <= now) {
      notifyUser(r.title);
      r.done = true;
    }
  });

  localStorage.setItem(REMINDERS_KEY, JSON.stringify(arr));
}

function updateProgress() {
  const todos = document.querySelectorAll('.todo');
  const completed = document.querySelectorAll('.todo.completed');
  const percent = todos.length ? Math.round((completed.length / todos.length) * 100) : 0;
  progressBarFill.style.width = percent + '%';
  progressText.innerText = `${percent}% complete • ${completed.length} / ${todos.length}`;
  progressText.style.textAlign = 'center';
}


function changeTheme(color) {
  savedTheme = color;
  localStorage.setItem(THEME_KEY, color);
  document.body.className = color;
  document.querySelectorAll('button').forEach(btn => {
    btn.className = `${btn.classList[0]} ${color}-button`;
  });
  document.querySelectorAll('.todo').forEach(todo => {
    todo.className = todo.classList.contains('completed')
      ? `todo ${color}-todo completed`
      : `todo ${color}-todo`;
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  getTodosArray().forEach(renderTodoElement);
  renderRemindersList();
  updateProgress();

  // check reminders every 10 seconds
  if ("Notification" in window) Notification.requestPermission();
  setInterval(checkReminders, 10000);
});

// ===== Theme key (تعريف ثابت وآمن) =====

// ===== Theme buttons selectors =====
const themeButtons = document.querySelectorAll('.theme-selector');

// Apply saved theme when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem(THEME_KEY);
  // remove any possible theme classes first
  document.body.classList.remove('standard', 'light', 'darker');

  if (savedTheme === 'standard' || savedTheme === 'light' || savedTheme === 'darker') {
    document.body.classList.add(savedTheme);
  } else {
    // default theme
    document.body.classList.add('standard');
    localStorage.setItem(THEME_KEY, 'standard');
  }

  // attach click handlers AFTER DOM loaded (safest)
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      let theme = 'standard';
      if (btn.classList.contains('standard-theme')) theme = 'standard';
      else if (btn.classList.contains('light-theme')) theme = 'light';
      else if (btn.classList.contains('darker-theme')) theme = 'darker';

      document.body.classList.remove('standard', 'light', 'darker');
      document.body.classList.add(theme);
      localStorage.setItem(THEME_KEY, theme);
    });
  });
});
