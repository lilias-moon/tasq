use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: u32,
    pub name: String,
    pub added: String,
    pub deadline: Option<String>,
    pub time: Option<String>,
    pub color: Option<String>,
    pub done: bool,
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub angle: Option<f64>,
}

impl Task {
    const DEFAULT_COLOR: &'static str = "#a78bfa";

    pub fn color_or_default(&self) -> &str {
        self.color.as_deref().unwrap_or(Self::DEFAULT_COLOR)
    }
}
