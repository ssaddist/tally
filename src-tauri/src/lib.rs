use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, Runtime, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_sql::{Migration, MigrationKind};

const DB_URL: &str = "sqlite:subscriptions.db";
const TRAY_ID: &str = "main";
const HIDDEN_ARG: &str = "--hidden";
const MAX_TRAY_LINES: usize = 8;

fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_trial_end_date",
            sql: include_str!("../migrations/002_trials.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "manual_renewal_and_payments",
            sql: include_str!("../migrations/003_manual_renewal.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn build_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    lines: &[String],
    open_label: &str,
    quit_label: &str,
) -> tauri::Result<Menu<R>> {
    let menu = Menu::new(app)?;
    for (i, line) in lines.iter().take(MAX_TRAY_LINES).enumerate() {
        menu.append(&MenuItem::with_id(app, format!("info-{i}"), line, false, None::<&str>)?)?;
    }
    if !lines.is_empty() {
        menu.append(&PredefinedMenuItem::separator(app)?)?;
    }
    menu.append(&MenuItem::with_id(app, "open", open_label, true, None::<&str>)?)?;
    menu.append(&MenuItem::with_id(app, "quit", quit_label, true, None::<&str>)?)?;
    Ok(menu)
}

#[tauri::command]
fn update_tray(
    app: AppHandle,
    lines: Vec<String>,
    open_label: String,
    quit_label: String,
    tooltip: String,
) -> Result<(), String> {
    let tray = app.tray_by_id(TRAY_ID).ok_or("tray icon is not available")?;
    let menu = build_tray_menu(&app, &lines, &open_label, &quit_label).map_err(|e| e.to_string())?;
    tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    tray.set_tooltip(Some(tooltip)).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![HIDDEN_ARG]),
        ))
        .invoke_handler(tauri::generate_handler![update_tray])
        .setup(|app| {
            let handle = app.handle();
            let menu = build_tray_menu(handle, &[], "Open Tally", "Quit")?;
            let mut tray = TrayIconBuilder::with_id(TRAY_ID)
                .tooltip("Tally")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                });
            #[cfg(target_os = "macos")]
            {
                let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray-icon.png"))?;
                tray = tray.icon(icon).icon_as_template(true);
            }
            #[cfg(not(target_os = "macos"))]
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;

            if !std::env::args().any(|arg| arg == HIDDEN_ARG) {
                show_main_window(handle);
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building Tally")
        .run(|_app, _event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = _event {
                show_main_window(_app);
            }
        });
}
