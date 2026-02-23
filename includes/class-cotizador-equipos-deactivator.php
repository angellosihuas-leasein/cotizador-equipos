<?php
class Cotizador_Equipos_Deactivator {

	public static function deactivate() {
		flush_rewrite_rules();
	}
}