<?php
/**
 * Plugin Name:       Cotizador de Equipos - Leasein
 * Plugin URI:        https://leasein.pe/
 * Description:       Cotizador avanzado con reglas de precios, gamas y plazos para alquiler de equipos y leasing operativo.
 * Version:           1.1.0
 * Author:            Leasein alquiler de laptops
 * Author URI:        https://leasein.pe/
 * Text Domain:       cotizador-equipos
 * Domain Path:       /languages
 */

// Si este archivo es llamado directamente, abortamos por seguridad.
if ( ! defined( 'WPINC' ) ) {
    die;
}

/**
 * Actualmente la versión del plugin.
 * Útil para limpiar la caché de hojas de estilo y scripts.
 */
define( 'COTIZADOR_EQUIPOS_VERSION', '1.1.0' );

/**
 * El código que se ejecuta durante la activación del plugin.
 */
function activar_cotizador_equipos() {
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-equipos-activator.php';
    Cotizador_Equipos_Activator::activate();
}

/**
 * El código que se ejecuta durante la desactivación del plugin.
 */
function desactivar_cotizador_equipos() {
    require_once plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-equipos-deactivator.php';
    Cotizador_Equipos_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activar_cotizador_equipos' );
register_deactivation_hook( __FILE__, 'desactivar_cotizador_equipos' );

/**
 * La clase principal (Core) del plugin que incluye todas las demás dependencias.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-equipos.php';

/**
 * --- NUEVA INTEGRACIÓN: CLASE AJAX ---
 * Cargamos la clase que manejará las validaciones (RUC) y el envío seguro del formulario.
 */
require_once plugin_dir_path( __FILE__ ) . 'includes/class-cotizador-ajax.php';

/**
 * --- NUEVA INTEGRACIÓN: VARIABLES DE SEGURIDAD JS ---
 * Inyectamos de forma segura la URL de AJAX y el Nonce (CSRF) al script público.
 */
function cotizador_equipos_inyectar_variables_js() {
    // 'cotizador-equipos' es el nombre (handle) estándar que usa el boilerplate para tu JS.
    // Si en tu consola dice que 'cotizadorWP' no está definido, cambia 'cotizador-equipos' 
    // por 'cotizador-equipos-public' dependiendo de cómo esté en tu clase public.
    wp_localize_script( 'cotizador-equipos-public', 'cotizadorWP', array(
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'cotizador_nonce_action' )
    ));
}
// Usamos prioridad 20 para asegurar que se ejecute DESPUÉS de que tu plugin haya registrado el JS original
add_action( 'wp_enqueue_scripts', 'cotizador_equipos_inyectar_variables_js', 20 );

/**
 * Comienza la ejecución del plugin.
 */
function run_cotizador_equipos() {
    $plugin = new Cotizador_Equipos();
    $plugin->run();
}
run_cotizador_equipos();