use std::fs;
use std::path::PathBuf;

use tauri::Manager;

use crate::task::Task;

fn data_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.join("tasks.json"))
        .map_err(|e| e.to_string())
}

pub fn load_tasks(app: &tauri::AppHandle) -> Result<Vec<Task>, String> {
    let path = data_path(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(vec![]);
    }

    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub fn save_tasks(app: &tauri::AppHandle, tasks: &[Task]) -> Result<(), String> {
    let path = data_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string(tasks).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}
