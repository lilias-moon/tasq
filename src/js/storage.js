const { invoke } = window.__TAURI__.core;

export async function loadTasks() {
  return invoke('load_tasks');
}

export async function saveTasks(tasks) {
  await invoke('save_tasks', { tasks });
}