import { state } from './state.js';
import {saveTasks as writeTasks} from './storage.js';
import { addBlock ,removeBlock} from './physics.js';
const {sendNotification,isPermissionGranted,requestPermission} = 
 window.__TAURI_PLUGIN_NOTIFICATION__;

 let afterChange = () => {};

export function setAfterChange(fn){
    afterChange = fn;
} 

export async function saveTasks(tasks){
    await writeTasks(state.tasks);
}

export async function toggleDone(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.done = !task.done;
    if (task.done) {
      let permitted = await isPermissionGranted();
      if (!permitted) {
        const permission = await requestPermission();
        permitted = permission === 'granted';
      }
      if (permitted) {
        sendNotification({ title: '✓ タスク完了', body: task.name });
      }
    }
    afterChange();
    saveTasks();
  }
}

export function deleteTask(taskId) {
  removeBlock(taskId);
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  if (state.selectedTaskId === taskId) state.selectedTaskId = null;
  afterChange();
  saveTasks();
}

export function addTask() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) return;
  const deadline = document.getElementById('inp-deadline').value || null;
  const time = document.getElementById('inp-time').value || null;
  const color = document.getElementById('inp-color').value;
  const today = new Date().toISOString().split('T')[0];

  const task = { id: state.nextId++, name, added: today, deadline, time, color, done: false, x: null, y: null, angle: null };
  state.tasks.unshift(task);

  if (state.physicsEnabled) {
    addBlock(task);
  } 

  afterChange();

  document.getElementById('inp-name').value = '';
  document.getElementById('inp-deadline').value = '';
  document.getElementById('inp-time').value = '';

  saveTasks();
}