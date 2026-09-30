//! Rust jádro Parťáka.
//!
//! Okno je průhledné, bez rámečku, vždy navrchu a roztažené přes pracovní plochu
//! hlavního monitoru. Aby šlo normálně klikat do aplikací pod ním, je okno
//! „click-through“ — myš propouští všude kromě míst, která frontend nahlásí jako
//! interaktivní (avatar, bublina, panely). Hlídání kurzoru běží tady v Rustu,
//! protože když okno propouští myš, webview nedostává žádné události.

use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use serde::Deserialize;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

/// Obdélník v CSS pixelech relativně k oknu.
#[derive(Deserialize, Clone, Copy, Debug)]
struct Rect {
    x: f64,
    y: f64,
    w: f64,
    h: f64,
}

impl Rect {
    fn contains(&self, x: f64, y: f64) -> bool {
        x >= self.x && x <= self.x + self.w && y >= self.y && y <= self.y + self.h
    }
}

#[derive(Default)]
struct HitRects(Mutex<Vec<Rect>>);

/// Frontend posílá, kde jsou interaktivní prvky (avatar, bublina, panely).
#[tauri::command]
fn set_hit_rects(state: tauri::State<HitRects>, rects: Vec<Rect>) {
    *state.0.lock().unwrap() = rects;
}

/// Roztáhne okno přes pracovní plochu (bez hlavního panelu Windows / Docku).
fn fit_to_work_area(win: &WebviewWindow) -> tauri::Result<()> {
    let monitor = match win.primary_monitor()? {
        Some(m) => m,
        None => return Ok(()),
    };
    let area = monitor.work_area();
    win.set_position(PhysicalPosition::new(area.position.x, area.position.y))?;
    win.set_size(PhysicalSize::new(area.size.width, area.size.height))?;
    Ok(())
}

/// ~30× za sekundu: přepíná propouštění myši a posílá frontendu polohu kurzoru
/// (avatar za ním kouká očima).
fn spawn_cursor_watcher(win: WebviewWindow) {
    thread::spawn(move || {
        let mut ignoring: Option<bool> = None;
        let mut last = (f64::NAN, f64::NAN);
        loop {
            thread::sleep(Duration::from_millis(33));
            let (Ok(cursor), Ok(origin), Ok(scale)) =
                (win.cursor_position(), win.outer_position(), win.scale_factor())
            else {
                continue;
            };
            let x = (cursor.x - origin.x as f64) / scale;
            let y = (cursor.y - origin.y as f64) / scale;

            let over_ui = {
                let rects = win.state::<HitRects>();
                let rects = rects.0.lock().unwrap();
                rects.iter().any(|r| r.contains(x, y))
            };
            let ignore = !over_ui;
            if ignoring != Some(ignore) && win.set_ignore_cursor_events(ignore).is_ok() {
                ignoring = Some(ignore);
            }

            if (x, y) != last {
                last = (x, y);
                let _ = win.emit("cursor", (x, y));
            }
        }
    });
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Schovat / ukázat Parťáka", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Ukončit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle, &quit])?;

    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip("Parťák")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "toggle" => {
                if let Some(win) = app.get_webview_window("main") {
                    if win.is_visible().unwrap_or(true) {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                    }
                }
            }
            _ => {}
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(HitRects::default())
        .invoke_handler(tauri::generate_handler![set_hit_rects])
        .setup(|app| {
            // Na Macu bez ikony v Docku — Parťák žije jen na ploše a v liště.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            build_tray(app.handle())?;

            let win = app
                .get_webview_window("main")
                .expect("okno 'main' je definované v tauri.conf.json");
            fit_to_work_area(&win)?;
            // Propouštění myši až po zobrazení — skryté okno ještě nemá nativní
            // plochu a na Linuxu by to spadlo.
            win.show()?;
            win.set_ignore_cursor_events(true)?;
            spawn_cursor_watcher(win);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("chyba při spuštění Parťáka");
}
