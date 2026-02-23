<?php
class Cotizador_Equipos_Admin {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version = $version;
	}

	public function add_plugin_admin_menu() {
		add_menu_page(
			'Cotizador de Equipos', 
			'Cotizador', 
			'manage_options', 
			$this->plugin_name, 
			array( $this, 'display_plugin_setup_page' ),
			'dashicons-calculator', 
			26 
		);
	}

	public function display_plugin_setup_page() {
		$settings = Cotizador_Equipos_Settings::get();
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/partials/cotizador-equipos-admin-display.php';
	}

	public function enqueue_scripts( $hook_suffix ) {
		if ( 'toplevel_page_' . $this->plugin_name !== $hook_suffix ) {
			return;
		}

		wp_enqueue_style(
			$this->plugin_name . '-admin-fonts',
			'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap',
			array(),
			null
		);

		wp_enqueue_script( 'tailwindcss-cdn', 'https://cdn.tailwindcss.com', array(), null, false );
		wp_add_inline_script(
			'tailwindcss-cdn',
			"tailwind.config = { important: '.cotizador-admin-wrap', corePlugins: { preflight: false }, theme: { extend: { fontFamily: { sans: ['Poppins', 'sans-serif'] } } } };",
			'before'
		);

		wp_enqueue_script(
			'alpinejs-cdn',
			'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
			array(),
			null,
			array( 'strategy' => 'defer' )
		);
	}

	public function handle_save_settings() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'No tienes permisos para realizar esta accion.', 'cotizador-equipos' ) );
		}

		check_admin_referer( 'ce_save_settings', 'ce_nonce' );

		$settings_json = isset( $_POST['ce_settings_json'] ) ? wp_unslash( $_POST['ce_settings_json'] ) : '';
		$decoded       = json_decode( $settings_json, true );

		if ( ! is_array( $decoded ) ) {
			$decoded = array();
		}

		$sanitized_settings = Cotizador_Equipos_Settings::sanitize( $decoded );
		update_option( Cotizador_Equipos_Settings::OPTION_KEY, $sanitized_settings, false );

		$redirect_url = add_query_arg(
			array(
				'page'             => $this->plugin_name,
				'settings-updated' => '1',
			),
			admin_url( 'admin.php' )
		);

		wp_safe_redirect( $redirect_url );
		exit;
	}
}
