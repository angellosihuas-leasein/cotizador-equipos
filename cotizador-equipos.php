<?php
/**
 * Plugin Name:       Cotizador de Equipos - Leasein
 * Plugin URI:        https://leasein.pe/
 * Description:       Cotizador avanzado con reglas de precios, gamas y plazos para alquiler de equipos y leasing operativo.
 * Version:           5.0.0
 * Author:            Leasein alquiler de laptops
 * Author URI:        https://leasein.pe/
 * Text Domain:       cotizador-equipos
 * Domain Path:       /languages
 */

// Si este archivo es llamado directamente, abortamos por seguridad.
if ( ! defined( 'WPINC' ) ) {
    die;
}
define( 'COTIZADOR_EQUIPOS_VERSION', '5.0.0' );

function activar_cotizador_equipos() {
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-equipos-activator.php';
    Cotizador_Equipos_Activator::activate();
}

function desactivar_cotizador_equipos() {
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-equipos-deactivator.php';
    Cotizador_Equipos_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activar_cotizador_equipos' );
register_deactivation_hook( __FILE__, 'desactivar_cotizador_equipos' );

require plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-equipos.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-ajax.php';

// ELIMINADO: La inyección de variables globales JS se movió al renderizador del shortcode
// para evitar cargar AJAX url y nonces en páginas donde no se usa el cotizador.

function run_cotizador_equipos() {
    $plugin = new Cotizador_Equipos();
    $plugin->run();
}
run_cotizador_equipos();