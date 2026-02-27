<?php
// Si se intenta acceder directamente al archivo, salimos.
if (!defined('ABSPATH')) {
    exit;
}

class Cotizador_Ajax {

    public function __construct() {
        // Registramos los endpoints AJAX
        // nopriv = Para usuarios no logueados (visitantes de la web)
        add_action('wp_ajax_nopriv_cotizador_validar_ruc', array($this, 'validar_ruc'));
        add_action('wp_ajax_cotizador_validar_ruc', array($this, 'validar_ruc'));

        add_action('wp_ajax_nopriv_cotizador_enviar', array($this, 'enviar_cotizacion'));
        add_action('wp_ajax_cotizador_enviar', array($this, 'enviar_cotizacion'));
    }

    /**
     * Endpoint para validar el RUC usando la API de Decolecta
     */
    public function validar_ruc() {
        // 1. Verificación básica de seguridad (Nonce)
        if (!check_ajax_referer('cotizador_nonce_action', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Error de seguridad. Recarga la página.'));
        }

        $ruc = isset($_POST['ruc']) ? sanitize_text_field($_POST['ruc']) : '';

        // Validación básica
        if (empty($ruc)) {
            wp_send_json_error(array('message' => 'RUC es requerido'));
        }

        if (!preg_match('/^20\d{9}$/', $ruc)) {
            wp_send_json_error(array('message' => 'RUC inválido: debe comenzar con 20 y tener 11 dígitos'));
        }

        // Llamada a la API de Decolecta (Usando wp_remote_get que es nativo de WP)
        $url = 'https://api.decolecta.com/v1/sunat/ruc/full?numero=' . $ruc;
        
        $args = array(
            'timeout'     => 30,
            'headers'     => array(
                'Authorization' => 'Bearer sk_4714.9qm5vk8GisuzWN88MtYeFvyhr74veZKX',
                'Content-Type'  => 'application/json'
            ),
        );

        $response = wp_remote_get($url, $args);

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'Error al validar RUC: ' . $response->get_error_message()));
        }

        $http_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);

        if ($http_code === 200 && !empty($result)) {
            // Nota: Aquí he omitido temporalmente lo de "ruc_cache" en base de datos.
            // Es mejor primero asegurar que la API funciona.
            wp_send_json_success(array('data' => $result));
        } else {
            wp_send_json_error(array('message' => 'Error en la API, código HTTP: ' . $http_code));
        }
    }

    /**
     * Endpoint para recibir y procesar el formulario final
     */
    public function enviar_cotizacion() {
        // 1. Verificación básica de seguridad (Nonce)
        if (!check_ajax_referer('cotizador_nonce_action', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Error de seguridad. Recarga la página.'));
        }

        // 2. Recibir y limpiar los datos que manda el JS
        $nombre = sanitize_text_field($_POST['nombre'] ?? '');
        $correo = sanitize_email($_POST['correo'] ?? '');
        $ruc = sanitize_text_field($_POST['ruc'] ?? '');
        $telefono = sanitize_text_field($_POST['telefono'] ?? '');
        
        // Datos técnicos del cotizador
        $procesador_id = sanitize_text_field($_POST['procesador_id'] ?? '');
        $gama_id = sanitize_text_field($_POST['gama_id'] ?? '');
        $cantidad = intval($_POST['cantidad'] ?? 1);
        $tiempo_valor = intval($_POST['tiempo_valor'] ?? 1);
        $tiempo_unidad = sanitize_text_field($_POST['tiempo_unidad'] ?? '');

        // Validación básica de servidor
        if(empty($nombre) || empty($correo) || empty($ruc)) {
            wp_send_json_error(array('message' => 'Faltan datos obligatorios.'));
        }

        // ==========================================
        // AQUÍ IRÁ EL CÓDIGO DE ODOO EN EL FUTURO
        // Por ahora lo simularemos con éxito
        // ==========================================

        error_log("Recibida cotización de: $nombre ($correo) - RUC: $ruc");

        // Si todo sale bien:
        wp_send_json_success(array(
            'message' => 'Cotización recibida y procesada correctamente.',
            // Si necesitas devolver una URL para redirigir (como el gracias_url), puedes hacerlo aquí
            // 'url_redirect' => '/gracias' 
        ));
    }
}

// Inicializamos la clase
new Cotizador_Ajax();