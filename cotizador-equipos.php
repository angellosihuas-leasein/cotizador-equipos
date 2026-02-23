<?php
/**
 * Plugin Name:       Cotizador de Equipos
 * Plugin URI:        https://tusitio.com/
 * Description:       Cotizador avanzado con reglas de precios, gamas y plazos para alquiler de equipos.
 * Version:           1.1.0
 * Author:            Tu Nombre
 * Author URI:        https://tusitio.com/
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
 * Aquí crearemos las tablas en la base de datos más adelante.
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
 * Comienza la ejecución del plugin.
 * * Usamos una función para iniciar todas las clases y hooks del plugin
 * asegurando que se carguen en el momento correcto dentro de WordPress.
 */
function run_cotizador_equipos() {
	$plugin = new Cotizador_Equipos();
	$plugin->run();
}
run_cotizador_equipos();
