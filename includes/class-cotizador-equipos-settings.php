<?php

class Cotizador_Equipos_Settings {

	const OPTION_KEY = 'cotizador_equipos_settings';

	public static function get() {
		$stored = get_option( self::OPTION_KEY, array() );

		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		return self::sanitize( $stored );
	}

	public static function get_defaults() {
		return array(
			'currency_code'   => 'PEN',
			'currency_symbol' => 'S/.',
			'texts'           => array(
				'welcome_eyebrow' => 'COTIZADOR DIGITAL',
				'welcome_title'   => 'Cotiza el alquiler de laptops <span style="color:#ea580c;">para tu empresa</span> en segundos.',
				'welcome_subtitle'=> 'Obtén precios al instante con nuestro cotizador digital o configura una propuesta técnica a medida.',
				'btn_smart'       => 'Iniciar cotización inteligente →',
				'btn_manual'      => 'Configura aquí',
				'step1_eyebrow'   => 'PASO 1 DE 4',
				'step1_title'     => '¿Qué aplicaciones vas a utilizar?',
				'step1_subtitle'  => 'Elige la potencia que mejor se adapta a tus tareas habituales.',
				'step2_eyebrow'   => 'PASO 2 DE 4',
				'step2_title'     => '¿Qué tan pesada será la jornada para tu laptop?',
				'step2_subtitle'  => 'El chasis determina la durabilidad, ventilación y portabilidad del equipo.',
				'step3_eyebrow'   => 'PASO 3 DE 4',
				'step3_title'     => 'Elige el tiempo de alquiler',
				'step3_subtitle'  => 'Selecciona unidad y cantidad; calculamos el periodo exacto automáticamente.',
				'step4_eyebrow'   => 'PASO 4 DE 4',
				'step4_title'     => 'Tu cotización está lista',
				'step4_subtitle'  => 'Revisa el resumen antes de solicitar contacto.',
				'btn_next'        => 'Continuar →',
				'btn_back'        => '← Volver',
				'btn_finish'      => 'Ver mi solución',
				'btn_restart'     => 'Cambiar selección',
				'btn_request'     => 'Quiero hablar con un especialista ahora →',
				'price_label'     => 'CUOTA MENSUAL / LAPTOP',
				'quantity_label'  => 'Cantidad de laptops',
				'period_label'    => 'Duración del alquiler',
				'whatsapp_label'  => 'Quiero hablar con un especialista ahora',
				'whatsapp_desc'   => 'Si prefieres, te atendemos por WhatsApp y armamos la cotización contigo.',
				'whatsapp_url'    => 'https://wa.me/',
				'manual_link'     => '¿Ya conoces lo que quieres? Configúralo manualmente',
				'manual_title'    => 'Configuración rápida',
				'manual_apply'    => 'Aplicar e ir al resumen',
			),
			'processors'      => array(
				array( 'id' => 'i5', 'label' => 'Core i5', 'front_label' => 'Aplicaciones estándar', 'description' => 'Uso principalmente Office, correos, videollamadas y navegación fluida.' ),
				array( 'id' => 'i7', 'label' => 'Core i7', 'front_label' => 'Software de alto rendimiento', 'description' => 'Para programación, análisis masivo de datos o procesos que requieren respuesta inmediata.' ),
			),
			'gamas'           => array(
				array( 'id' => 'baja', 'label' => 'Gama baja', 'front_label' => 'Funcionalidad al mejor precio', 'description' => 'Ideal para puestos administrativos en lugares fijos que buscan optimizar la inversión.' ),
				array( 'id' => 'media', 'label' => 'Gama media', 'front_label' => 'Productividad constante para oficina', 'description' => 'Diseñada para jornadas intensas que necesitan una laptop que no se caliente ni se ralentice.' ),
				array( 'id' => 'alta', 'label' => 'Gama alta', 'front_label' => 'Trabajo de campo y condiciones exigentes', 'description' => 'Equipos con protección reforzada para ambientes demandantes y uso intensivo.' ),
			),
			'periods'         => array(
				array( 'id' => 'semana_1', 'label' => '1 semana', 'front_label' => '1 semana', 'description' => 'Periodo corto para proyectos puntuales.', 'unit' => 'semanas', 'min_value' => 1, 'max_value' => 1 ),
				array( 'id' => 'semanas_2_4', 'label' => '2 a 4 semanas', 'front_label' => '2 a 4 semanas', 'description' => 'Plan temporal extendido por semanas.', 'unit' => 'semanas', 'min_value' => 2, 'max_value' => 4 ),
				array( 'id' => 'meses_1_12', 'label' => '1 a 12 meses', 'front_label' => '1 a 12 meses', 'description' => 'Plan mensual para contratos estables.', 'unit' => 'meses', 'min_value' => 1, 'max_value' => 12 ),
			),
			'extras'          => array(
				array( 'id' => 'ram_8', 'type' => 'ram', 'label' => '8GB RAM Extra', 'price' => '20.00' ),
				array( 'id' => 'hdd_1tb', 'type' => 'almacenamiento', 'label' => '1TB HDD Extra', 'price' => '30.00' ),
			),
			'prices'          => array(),
		);
	}

	public static function sanitize( $raw_settings ) {
		$defaults = self::get_defaults();
		$raw      = is_array( $raw_settings ) ? $raw_settings : array();
		$settings = array();

		// Moneda
		$currency_map  = array('PEN' => 'S/.', 'USD' => '$', 'COP' => '$');
		$currency_code = isset( $raw['currency_code'] ) ? strtoupper( sanitize_text_field( wp_unslash( $raw['currency_code'] ) ) ) : '';

		if ( ! isset( $currency_map[ $currency_code ] ) ) {
			$currency_code = $defaults['currency_code'];
		}
		$settings['currency_code']   = $currency_code;
		$settings['currency_symbol'] = $currency_map[ $currency_code ];

		// Sanitizaciones
		$settings['texts'] = self::sanitize_texts( isset( $raw['texts'] ) && is_array( $raw['texts'] ) ? $raw['texts'] : array(), $defaults['texts'] );
		$settings['processors'] = self::sanitize_options_list( isset( $raw['processors'] ) ? $raw['processors'] : array(), 'proc', $defaults['processors'] );
		$settings['gamas'] = self::sanitize_options_list( isset( $raw['gamas'] ) ? $raw['gamas'] : array(), 'gama', $defaults['gamas'] );
		$settings['periods'] = self::sanitize_periods( isset( $raw['periods'] ) ? $raw['periods'] : array(), 'periodo', $defaults['periods'] );
		$settings['extras'] = self::sanitize_extras( isset( $raw['extras'] ) ? $raw['extras'] : array(), 'extra', $defaults['extras'] );

		// Precios
		$prices_raw = isset( $raw['prices'] ) && is_array( $raw['prices'] ) ? $raw['prices'] : array();
		$settings['prices'] = self::sanitize_prices( $prices_raw, $settings['processors'], $settings['gamas'], $settings['periods'] );

		return $settings;
	}

	private static function sanitize_texts( $texts_raw, $defaults ) {
		$texts = array();
		$html_fields = array('welcome_title', 'welcome_subtitle');

		foreach ( $defaults as $key => $default_value ) {
			if ( ! isset( $texts_raw[ $key ] ) ) { 
				$value = ''; 
			} elseif ( in_array( $key, $html_fields, true ) ) {
				$value = wp_kses_post( wp_unslash( $texts_raw[ $key ] ) );
			} elseif ( 'whatsapp_url' === $key ) { 
				$value = esc_url_raw( wp_unslash( $texts_raw[ $key ] ) ); 
			} else { 
				$value = sanitize_text_field( wp_unslash( $texts_raw[ $key ] ) ); 
			}
			
			if ( '' === $value ) { $value = $default_value; }
			$texts[ $key ] = $value;
		}
		return $texts;
	}

	private static function sanitize_options_list( $items_raw, $prefix, $fallback_items ) {
		$items_raw = is_array( $items_raw ) ? $items_raw : array();
		$cleaned   = array();
		$used_ids  = array();

		foreach ( $items_raw as $index => $item ) {
			if ( ! is_array( $item ) ) continue;
			$label = isset( $item['label'] ) ? sanitize_text_field( wp_unslash( $item['label'] ) ) : '';
			if ( '' === $label ) continue;

			$front_label = isset( $item['front_label'] ) ? sanitize_text_field( wp_unslash( $item['front_label'] ) ) : '';
			$description = isset( $item['description'] ) ? sanitize_textarea_field( wp_unslash( $item['description'] ) ) : '';
			$id          = isset( $item['id'] ) ? sanitize_key( wp_unslash( $item['id'] ) ) : '';

			if ( '' === $id ) $id = sanitize_title( $label );
			if ( '' === $id ) $id = $prefix . '_' . ( absint( $index ) + 1 );

			$base_id = $id; $suffix  = 2;
			while ( isset( $used_ids[ $id ] ) ) { $id = $base_id . '_' . $suffix; ++$suffix; }
			$used_ids[ $id ] = true;

			$cleaned[] = array( 'id' => $id, 'label' => $label, 'front_label' => '' === $front_label ? $label : $front_label, 'description' => $description );
		}
		return empty( $cleaned ) ? $fallback_items : $cleaned;
	}

	private static function sanitize_periods( $items_raw, $prefix, $fallback_items ) {
		$items_raw = is_array( $items_raw ) ? $items_raw : array();
		$cleaned = array(); $used_ids = array();
		$allowed_units = array( 'dias', 'semanas', 'meses' );

		foreach ( $items_raw as $index => $item ) {
			if ( ! is_array( $item ) ) continue;
			$label = isset( $item['label'] ) ? sanitize_text_field( wp_unslash( $item['label'] ) ) : '';
			if ( '' === $label ) continue;

			$id        = isset( $item['id'] ) ? sanitize_key( wp_unslash( $item['id'] ) ) : '';
			$unit      = isset( $item['unit'] ) ? sanitize_key( wp_unslash( $item['unit'] ) ) : 'meses';
			$min_value = isset( $item['min_value'] ) ? absint( $item['min_value'] ) : 1;
			$max_raw   = isset( $item['max_value'] ) ? sanitize_text_field( wp_unslash( $item['max_value'] ) ) : '';

			if ( '' === $id ) $id = sanitize_title( $label );
			if ( '' === $id ) $id = $prefix . '_' . ( absint( $index ) + 1 );

			$base_id = $id; $suffix = 2;
			while ( isset( $used_ids[ $id ] ) ) { $id = $base_id . '_' . $suffix; ++$suffix; }
			$used_ids[ $id ] = true;

			if ( ! in_array( $unit, $allowed_units, true ) ) $unit = 'meses';
			if ( $min_value < 1 ) $min_value = 1;

			$max_value = '';
			if ( '' !== $max_raw ) {
				$max_value = absint( $max_raw );
				if ( $max_value > 0 && $max_value < $min_value ) $max_value = $min_value;
				if ( 0 === $max_value ) $max_value = '';
			}

			$cleaned[] = array( 'id' => $id, 'label' => $label, 'unit' => $unit, 'min_value' => $min_value, 'max_value' => $max_value );
		}
		return empty( $cleaned ) ? $fallback_items : $cleaned;
	}

	private static function sanitize_extras( $items_raw, $prefix, $fallback_items ) {
		$items_raw = is_array( $items_raw ) ? $items_raw : array();
		$cleaned   = array();
		$used_ids  = array();
		$allowed_types = array( 'ram', 'almacenamiento' );

		foreach ( $items_raw as $index => $item ) {
			if ( ! is_array( $item ) ) continue;
			$label = isset( $item['label'] ) ? sanitize_text_field( wp_unslash( $item['label'] ) ) : '';
			if ( '' === $label ) continue;

			$id    = isset( $item['id'] ) ? sanitize_key( wp_unslash( $item['id'] ) ) : '';
			$type  = isset( $item['type'] ) && in_array( $item['type'], $allowed_types ) ? $item['type'] : 'ram';
			$price = isset( $item['price'] ) ? sanitize_text_field( wp_unslash( $item['price'] ) ) : '0';
			$numeric_price = is_numeric($price) ? max( 0, (float) $price ) : 0;

			if ( '' === $id ) $id = sanitize_title( $label );
			if ( '' === $id ) $id = $prefix . '_' . ( absint( $index ) + 1 );

			$base_id = $id; $suffix = 2;
			while ( isset( $used_ids[ $id ] ) ) { $id = $base_id . '_' . $suffix; ++$suffix; }
			$used_ids[ $id ] = true;

			$cleaned[] = array( 'id' => $id, 'type' => $type, 'label' => $label, 'price' => number_format( $numeric_price, 2, '.', '' ) );
		}
		return empty( $cleaned ) ? $fallback_items : $cleaned;
	}

	private static function sanitize_prices( $prices_raw, $processors, $gamas, $periods ) {
		$prices = array();
		foreach ( $processors as $processor ) {
			$processor_id = $processor['id'];
			$prices[ $processor_id ] = array();
			foreach ( $gamas as $gama ) {
				$gama_id = $gama['id'];
				$prices[ $processor_id ][ $gama_id ] = array();
				foreach ( $periods as $period ) {
					$period_id = $period['id'];
					$value     = '';
					if ( isset( $prices_raw[ $processor_id ][ $gama_id ][ $period_id ] ) ) {
						$raw_price = wp_unslash( $prices_raw[ $processor_id ][ $gama_id ][ $period_id ] );
						$raw_price = is_scalar( $raw_price ) ? str_replace( ',', '.', (string) $raw_price ) : '';
						if ( '' !== $raw_price ) {
							$numeric_price = max( 0, (float) $raw_price );
							$value         = number_format( $numeric_price, 2, '.', '' );
						}
					}
					$prices[ $processor_id ][ $gama_id ][ $period_id ] = $value;
				}
			}
		}
		return $prices;
	}
}