<?php
class Cotizador_Equipos_Activator {

	public static function activate() {
		require_once dirname( __FILE__ ) . '/class-cotizador-equipos-settings.php';

		if ( false === get_option( Cotizador_Equipos_Settings::OPTION_KEY, false ) ) {
			$defaults = Cotizador_Equipos_Settings::get_defaults();
			add_option( Cotizador_Equipos_Settings::OPTION_KEY, $defaults, '', false );
		}
	}
}
