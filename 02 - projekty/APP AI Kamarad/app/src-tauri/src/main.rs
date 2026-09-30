// Na Windows v release buildu nezobrazovat konzolové okno.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    partak_lib::run()
}
