<?php

class Cotizador_Equipos_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_assets() {
		// 1. ENCOLAMOS (wp_enqueue_*) los recursos globalmente.
        // Esto asegura que se inyecten en el <head> correctamente antes de que actúe la caché.
		wp_enqueue_style(
			$this->plugin_name . '-public',
			plugin_dir_url( __FILE__ ) . 'css/cotizador-equipos-public.css',
			array(),
			$this->version
		);

		wp_enqueue_script(
			$this->plugin_name . '-public',
			plugin_dir_url( __FILE__ ) . 'js/cotizador-equipos-public.js',
			array(),
			$this->version,
			true // El script seguirá cargando en el footer
		);

        // 2. Pasamos las variables al script aquí mismo
		wp_localize_script(
			$this->plugin_name . '-public',
			'cotizadorData',
			array(
				'pluginUrl' => plugin_dir_url( __FILE__ )
			)
		);

		// 3. Pasamos las variables de AJAX
		wp_localize_script( 
			$this->plugin_name . '-public', 
			'cotizadorWP', 
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'cotizador_nonce_action' )
			)
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

		// (ELIMINADO) Ya no encolamos ni pasamos variables locales aquí adentro 
        // para evitar que la caché rompa el diseño.

		ob_start();
		?>
		<div class="ce-cotizador" data-ce-config="<?php echo esc_attr( $json ); ?>"></div>
		<?php

		return ob_get_clean();
	}
}