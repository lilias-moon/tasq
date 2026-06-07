use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
struct Task {
    id: u32,
    name: String,
    added: String,
    deadline: Option<String>,
    time: Option<String>,
    color: Option<String>,
    done: bool,
    x: Option<f64>,
    y: Option<f64>,
    angle: Option<f64>,
}

fn data_path(app: &tauri::AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap().join("tasks.json")
}

#[tauri::command]
fn load_tasks(app: tauri::AppHandle) -> Vec<Task> {
    let path = data_path(&app);
    if !path.exists() {
        return vec![];
    }
    let content = fs::read_to_string(path).unwrap_or_default();
    serde_json::from_str(&content).unwrap_or_default()
}

#[tauri::command]
fn save_tasks(app: tauri::AppHandle, tasks: Vec<Task>) {
    let path = data_path(&app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).ok();
    }
    let content = serde_json::to_string(&tasks).unwrap();
    fs::write(path, content).ok();
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![load_tasks, save_tasks])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}