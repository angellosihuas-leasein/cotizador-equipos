<?php
class Cotizador_Equipos {

	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->version = '1.0.0';
		$this->plugin_name = 'cotizador-equipos';

		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-cotizador-equipos-settings.php';
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-cotizador-equipos-admin.php';
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'public/class-cotizador-equipos-public.php';
	}

	private function define_admin_hooks() {
		$plugin_admin = new Cotizador_Equipos_Admin( $this->get_plugin_name(), $this->get_version() );
		add_action( 'admin_menu', array( $plugin_admin, 'add_plugin_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $plugin_admin, 'enqueue_scripts' ) );
		add_action( 'admin_post_ce_save_settings', array( $plugin_admin, 'handle_save_settings' ) );
	}

	private function define_public_hooks() {
		$plugin_public = new Cotizador_Equipos_Public( $this->get_plugin_name(), $this->get_version() );
		add_action( 'init', array( $plugin_public, 'register_shortcodes' ) );
		add_action( 'wp_enqueue_scripts', array( $plugin_public, 'register_assets' ) );
	}

	public function run() {
	}

	public function get_plugin_name() {
		return $this->plugin_name;
	}

	public function get_version() {
		return $this->version;
	}
}
