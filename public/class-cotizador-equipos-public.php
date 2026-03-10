<?php

class Cotizador_Equipos_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_assets() {
		// 1. Solo REGISTRAMOS los recursos, no los encolamos globalmente.
		wp_register_style(
			$this->plugin_name . '-public',
			plugin_dir_url( __FILE__ ) . 'css/cotizador-equipos-public.css',
			array(),
			$this->version
		);

		wp_register_script(
			$this->plugin_name . '-public',
			plugin_dir_url( __FILE__ ) . 'js/cotizador-equipos-public.js',
			array(),
			$this->version,
			true // El script seguirá cargando en el footer
		);
	}

	public function register_shortcodes() {
		add_shortcode( 'cotizador_equipos', array( $this, 'render_shortcode' ) );
	}

	public function render_shortcode() {
		$settings = Cotizador_Equipos_Settings::get();
		$json     = wp_json_encode( $settings );

		if ( ! $json ) {
			return '';
		}

		// 2. ENCOLAMOS (Cargamos) los recursos únicamente cuando se lee este shortcode
		wp_enqueue_style( $this->plugin_name . '-public' );
		wp_enqueue_script( $this->plugin_name . '-public' );

		// 3. Pasamos las variables al script que acabamos de encolar
		wp_localize_script(
			$this->plugin_name . '-public',
			'cotizadorData',
			array(
				'pluginUrl' => plugin_dir_url( __FILE__ )
			)
		);

		// 4. Pasamos las variables de AJAX (las que estaban en el archivo principal antes)
		wp_localize_script( 
			$this->plugin_name . '-public', 
			'cotizadorWP', 
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'cotizador_nonce_action' )
			)
		);

		ob_start();
		?>
		<div class="ce-cotizador" data-ce-config="<?php echo esc_attr( $json ); ?>"></div>
		<?php

		return ob_get_clean();
	}
}