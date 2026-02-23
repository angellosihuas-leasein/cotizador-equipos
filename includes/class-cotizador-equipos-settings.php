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
				'step1_eyebrow'   => 'PASO 1 DE 4',
				'step1_title'     => '¿Qué aplicaciones vas a utilizar?',
				'step1_subtitle'  => 'Elige la potencia que mejor se adapta a tus tareas habituales.',
				'step2_eyebrow'   => 'PASO 2 DE 4',
				'step2_title'     => '¿Qué tan pesada será la jornada para tu laptop?',
				'step2_subtitle'  => 'El chasis determina la durabilidad, ventilación y portabilidad del equipo.',
				'step3_eyebrow'   => 'PASO 3 DE 4',
				'step3_title'     => 'Elige el tiempo de alquiler',
				'step3_subtitle'  => 'Selecciona la unidad y la cantidad de tiempo que necesitas.',
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
			),
			'processors'      => array(
				array(
					'id'          => 'i5',
					'label'       => 'Core i5',
					'front_label' => 'Aplicaciones estándar',
					'description' => 'Uso principalmente Office, correos, videollamadas y navegación fluida.',
				),
				array(
					'id'          => 'i7',
					'label'       => 'Core i7',
					'front_label' => 'Software de alto rendimiento',
					'description' => 'Para programación, análisis masivo de datos o procesos que requieren respuesta inmediata.',
				),
			),
			'gamas'           => array(
				array(
					'id'          => 'baja',
					'label'       => 'Gama baja',
					'front_label' => 'Funcionalidad al mejor precio',
					'description' => 'Ideal para puestos administrativos en lugares fijos que buscan optimizar la inversión.',
				),
				array(
					'id'          => 'media',
					'label'       => 'Gama media',
					'front_label' => 'Productividad constante para oficina',
					'description' => 'Diseñada para jornadas intensas que necesitan una laptop que no se caliente ni se ralentice.',
				),
			),
			'periods'         => array(
				array(
					'id'          => 'dia',
					'label'       => 'Día',
					'front_label' => 'Días',
					'description' => 'Precio base por día.',
				),
				array(
					'id'          => 'mes',
					'label'       => 'Mes',
					'front_label' => 'Meses',
					'description' => 'Precio base por mes.',
				),
			),
			'prices'          => array(),
		);
	}

	public static function sanitize( $raw_settings ) {
		$defaults = self::get_defaults();
		$raw      = is_array( $raw_settings ) ? $raw_settings : array();

		$settings = array();

		$currency_map  = array(
			'PEN' => 'S/.',
			'USD' => '$',
			'COP' => '$',
		);
		$currency_code = isset( $raw['currency_code'] ) ? strtoupper( sanitize_text_field( wp_unslash( $raw['currency_code'] ) ) ) : '';

		if ( ! isset( $currency_map[ $currency_code ] ) ) {
			$raw_symbol = isset( $raw['currency_symbol'] ) ? sanitize_text_field( wp_unslash( $raw['currency_symbol'] ) ) : '';
			if ( false !== strpos( $raw_symbol, 'S/' ) ) {
				$currency_code = 'PEN';
			} elseif ( '$' === $raw_symbol ) {
				$currency_code = 'USD';
			} else {
				$currency_code = $defaults['currency_code'];
			}
		}

		$settings['currency_code']   = $currency_code;
		$settings['currency_symbol'] = $currency_map[ $currency_code ];

		$settings['texts'] = self::sanitize_texts(
			isset( $raw['texts'] ) && is_array( $raw['texts'] ) ? $raw['texts'] : array(),
			$defaults['texts']
		);

		$settings['processors'] = self::sanitize_options_list(
			isset( $raw['processors'] ) ? $raw['processors'] : array(),
			'proc',
			$defaults['processors']
		);

		$settings['gamas'] = self::sanitize_options_list(
			isset( $raw['gamas'] ) ? $raw['gamas'] : array(),
			'gama',
			$defaults['gamas']
		);

		$settings['periods'] = self::sanitize_options_list(
			isset( $raw['periods'] ) ? $raw['periods'] : array(),
			'periodo',
			$defaults['periods']
		);

		$prices_raw = isset( $raw['prices'] ) && is_array( $raw['prices'] ) ? $raw['prices'] : array();
		$settings['prices'] = self::sanitize_prices(
			$prices_raw,
			$settings['processors'],
			$settings['gamas'],
			$settings['periods']
		);

		return $settings;
	}

	private static function sanitize_texts( $texts_raw, $defaults ) {
		$texts = array();

		foreach ( $defaults as $key => $default_value ) {
			$value = isset( $texts_raw[ $key ] ) ? sanitize_text_field( wp_unslash( $texts_raw[ $key ] ) ) : '';
			if ( '' === $value ) {
				$value = $default_value;
			}
			$texts[ $key ] = $value;
		}

		return $texts;
	}

	private static function sanitize_options_list( $items_raw, $prefix, $fallback_items ) {
		$items_raw = is_array( $items_raw ) ? $items_raw : array();
		$cleaned   = array();
		$used_ids  = array();

		foreach ( $items_raw as $index => $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$label = isset( $item['label'] ) ? sanitize_text_field( wp_unslash( $item['label'] ) ) : '';
			if ( '' === $label ) {
				continue;
			}

			$front_label = isset( $item['front_label'] ) ? sanitize_text_field( wp_unslash( $item['front_label'] ) ) : '';
			$description = isset( $item['description'] ) ? sanitize_textarea_field( wp_unslash( $item['description'] ) ) : '';
			$id          = isset( $item['id'] ) ? sanitize_key( wp_unslash( $item['id'] ) ) : '';

			if ( '' === $id ) {
				$id = sanitize_title( $label );
			}

			if ( '' === $id ) {
				$id = $prefix . '_' . ( absint( $index ) + 1 );
			}

			$base_id = $id;
			$suffix  = 2;
			while ( isset( $used_ids[ $id ] ) ) {
				$id = $base_id . '_' . $suffix;
				++$suffix;
			}

			$used_ids[ $id ] = true;

			$cleaned[] = array(
				'id'          => $id,
				'label'       => $label,
				'front_label' => $front_label,
				'description' => $description,
			);
		}

		if ( empty( $cleaned ) ) {
			return $fallback_items;
		}

		return $cleaned;
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

					if (
						isset( $prices_raw[ $processor_id ] ) &&
						is_array( $prices_raw[ $processor_id ] ) &&
						isset( $prices_raw[ $processor_id ][ $gama_id ] ) &&
						is_array( $prices_raw[ $processor_id ][ $gama_id ] ) &&
						isset( $prices_raw[ $processor_id ][ $gama_id ][ $period_id ] )
					) {
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