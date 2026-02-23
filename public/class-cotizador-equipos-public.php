<?php

class Cotizador_Equipos_Public {

	private $plugin_name;
	private $version;

	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	public function register_assets() {
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
			true
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

		$this->register_assets();
		wp_enqueue_style( $this->plugin_name . '-public' );
		wp_enqueue_script( $this->plugin_name . '-public' );

		ob_start();
		?>
		<div class="ce-cotizador" data-ce-config="<?php echo esc_attr( $json ); ?>"></div>
		<?php

		return ob_get_clean();
	}
}
