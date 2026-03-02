<?php
// Si se intenta acceder directamente al archivo, salimos.
if (!defined('ABSPATH')) {
    exit;
}

class Cotizador_Ajax {

    public function __construct() {
        // Registramos los endpoints AJAX
        add_action('wp_ajax_nopriv_cotizador_validar_ruc', array($this, 'validar_ruc'));
        add_action('wp_ajax_cotizador_validar_ruc', array($this, 'validar_ruc'));

        add_action('wp_ajax_nopriv_cotizador_enviar', array($this, 'enviar_cotizacion'));
        add_action('wp_ajax_cotizador_enviar', array($this, 'enviar_cotizacion'));
    }

    /**
     * Helper: Sistema de logs
     */
    private function log($message) {
        $log_file = WP_CONTENT_DIR . '/debug_cotizador.log';
        file_put_contents($log_file, date('Y-m-d H:i:s') . " - " . $message . "\n", FILE_APPEND);
    }

    /**
     * Helper: Función de encriptación (Reemplaza a crypt.php)
     */
    private function myCrypto($action, $string) {
        $output = false;
        $encrypt_method = "AES-128-CBC";
        $key = 'tr1buT3cn0log1@.';
        $iv = 'tr1buT3cn0log1@.';
        
        if ($action == 'encrypt') {
            $output = openssl_encrypt($string, $encrypt_method, $key, OPENSSL_RAW_DATA, $iv);
            $output = substr(base64_encode($output), 0, -2);
        } else if($action == 'decrypt') {
            $output = openssl_decrypt(base64_decode($string.'=='), $encrypt_method, $key, OPENSSL_RAW_DATA, $iv);
        }
        return $output;
    }

    /**
     * Endpoint: Validar RUC en Decolecta
     */
    public function validar_ruc() {
        if (!check_ajax_referer('cotizador_nonce_action', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Error de seguridad. Recarga la página.'));
        }

        $ruc = isset($_POST['ruc']) ? sanitize_text_field($_POST['ruc']) : '';
        if (empty($ruc)) wp_send_json_error(array('message' => 'RUC es requerido'));

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
            wp_send_json_success(array('data' => $result));
        } else {
            wp_send_json_error(array('message' => 'Error en la API, código HTTP: ' . $http_code));
        }
    }

    /**
     * Endpoint: Recibir formulario y procesar (Odoo, BD, WhatsApp)
     */
    public function enviar_cotizacion() {
        global $wpdb;

        if (!check_ajax_referer('cotizador_nonce_action', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Error de seguridad. Recarga la página.'));
        }

        $this->log("=== NUEVA SOLICITUD DE COTIZACIÓN RECIBIDA ===");

        // 1. Recoger datos del POST
        $p_nombre   = sanitize_text_field($_POST['nombre'] ?? '');
        $p_correo   = sanitize_email($_POST['correo'] ?? '');
        $p_ruc      = sanitize_text_field($_POST['ruc'] ?? '');
        $p_celular  = sanitize_text_field($_POST['telefono'] ?? '');
        
        $procesador_id = sanitize_text_field($_POST['procesador_id'] ?? '');
        $gama_id       = sanitize_text_field($_POST['gama_id'] ?? '');
        $p_cantidad    = intval($_POST['cantidad'] ?? 1);
        $p_duracion    = intval($_POST['tiempo_valor'] ?? 1);
        $p_tiempo      = sanitize_text_field($_POST['tiempo_unidad'] ?? '');

        // 2. Extraer precios y textos reales desde la configuración del plugin
        $settings = Cotizador_Equipos_Settings::get();
        
        // Obtener el periodo que encaja
        $matched_period_id = '';
        foreach ($settings['periods'] as $p) {
            if ($p['unit'] === $p_tiempo && $p_duracion >= $p['min_value'] && ($p['max_value'] === '' || $p_duracion <= intval($p['max_value']))) {
                $matched_period_id = $p['id'];
                break;
            }
        }

        // Obtener Precio Base Unitario Mensual
        $p_unit_price = 0;
        if ($matched_period_id && isset($settings['prices'][$procesador_id][$gama_id][$matched_period_id])) {
            $p_unit_price = floatval($settings['prices'][$procesador_id][$gama_id][$matched_period_id]);
        }

        // Obtener Etiquetas (Nombres Reales)
        $proc_label = 'Laptop Estándar';
        foreach ($settings['processors'] as $proc) {
            if ($proc['id'] === $procesador_id) { $proc_label = $proc['label']; break; }
        }

        // Variables por defecto / Fijas de tu lógica
        $p_empleados = '1-10 empleados'; // Simplificado por requerimiento
        $p_rol = 'No especificado';
        $p_so = 'Windows Pro';
        $p_ram_odoo = 16; // Odoo espera integer
        $p_ram_str = '16GB';
        $p_almacenamiento = 'Sólido 512GB';
        $p_fuente = 'cotizador_web';
        $p_personal = 0; 
        $hasta12 = 1;
        $masde12 = 0;
        $tarifa_total = $p_cantidad * $p_unit_price;

        // 3. Obtener Asesor (Lógica Antigua)
        $asesores_esta_web = ['Josselyn Cochachin'];
        $asesor_data = $wpdb->get_results("SELECT id, nombre, correo, firma, cargo, odoo_user_id, odoo_partner_id, telefono FROM asesores", ARRAY_A);
        
        if($asesor_data) {
            $asesor_data = array_filter($asesor_data, function($item) use ($asesores_esta_web) {
                return in_array($item['nombre'], $asesores_esta_web);
            });
        }
        
        $asesor = !empty($asesor_data) ? reset($asesor_data) : [
            'id' => 1, 'nombre' => 'Josselyn Cochachin', 'odoo_user_id' => 1, 'telefono' => '51987146591'
        ];
        $this->log("Asesor asignado: " . $asesor['nombre']);

        // 4. Insertar en BD Local (Tabla leads)
        // Se usa $wpdb->prepare para máxima seguridad contra inyecciones SQL
        $wpdb->query($wpdb->prepare(
            "INSERT INTO leads VALUES (DEFAULT, %s, %s, %s, NULL, %s, %s, %s, %s, %d, %d, %s, NULL, NULL, %s, %s, %s, NULL, NULL, %f, '0', %s, NULL, %s, NOW(), NULL, 1, 1, 0, 0, NULL, NULL, NULL, NULL, NULL)",
            $p_nombre, $p_correo, $p_ruc, $p_celular, $p_rol, $p_empleados, $proc_label, $p_cantidad, $p_duracion, $p_tiempo, $p_so, $p_ram_str, $p_almacenamiento, $p_unit_price, $asesor['nombre'], $p_fuente
        ));
        
        $ide = $wpdb->insert_id;
        $this->log("Lead insertado en BD local. ID: " . $ide);

        // 5. Generar URL de PDF Encriptada
        $pdf_url = 'https://leasein.pe/getpdf/download.php?code=' . urlencode($this->myCrypto('encrypt', (string)$ide));
        $pdf_json_string = ',"url_pdf": "' . $pdf_url . '"';

        // 6. Enviar Lead a Odoo
        $odoo_url = 'https://lease-in.odoo.com/jsonrpc';
        $odoo_user  = 'danielvdml-addons-leasein-master-7160506';
        $odoo_token = 'f8d380f7ec8c20b0e916e8ce4cebe7b684bb4f7a';

        $json_odoo = [
            "jsonrpc" => "2.0",
            "method" => "call",
            "params" => [
                "service" => "object",
                "method" => "execute",
                "args" => [
                    $odoo_user, 2, $odoo_token, "crm.lead", "create",
                    [
                        "name" => "Cotizador - leasein.pe | " . $p_nombre,
                        "type" => "lead",
                        "email_from" => $p_correo,
                        "phone" => $p_celular,
                        "contact_name" => $p_nombre,
                        "x_studio_tipo_de_documento" => "RUC",
                        "x_studio_numero_de_documento" => $p_ruc,
                        "user_id" => (int)$asesor['odoo_user_id'],
                        "asesor_phone" => $asesor['telefono'],
                        "numero_empleados" => $p_empleados,
                        "x_studio_periodo" => ucfirst($p_tiempo),
                        "x_studio_period_time" => $p_duracion,
                        "x_studio_system" => $p_so,
                        "x_studio_qty" => $p_cantidad,
                        "x_studio_procesador" => $proc_label,
                        "x_studio_ram" => $p_ram_odoo,
                        "x_studio_storage" => $p_almacenamiento,
                        "x_studio_costo_unit" => $p_unit_price,
                        "x_studio_costo_total" => $tarifa_total,
                        "lead_canal" => 2,
                        "lead_fuente" => 2,
                        "cotizador_hasta_12" => $hasta12,
                        "cotizador_mas_de_12" => $masde12,
                        "url_pdf" => $pdf_url // Mandamos la URL en el array directamente
                    ]
                ]
            ]
        ];

        $resp_odoo = wp_remote_post($odoo_url, [
            'body' => json_encode($json_odoo),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15
        ]);

        $lead_id = null;
        if (!is_wp_error($resp_odoo)) {
            $odoo_body = json_decode(wp_remote_retrieve_body($resp_odoo), true);
            $lead_id = $odoo_body['result'] ?? null;
            $this->log("Lead creado en Odoo con ID: " . $lead_id);
            
            // Renombrar en Odoo
            if ($lead_id) {
                $nuevo_name = sprintf('OPT-%d | Cotizador - leasein.pe', (int)$lead_id);
                $rename_payload = [
                    "jsonrpc" => "2.0", "method" => "call", "params" => [
                        "service" => "object", "method" => "execute_kw", "args" => [
                            $odoo_user, 2, $odoo_token, "crm.lead", "write",
                            [[(int)$lead_id], ["name" => $nuevo_name]]
                        ],
                        "kwargs" => ["context" => ["skip_opt_name" => true]]
                    ]
                ];
                wp_remote_post($odoo_url, ['body' => json_encode($rename_payload), 'headers' => ['Content-Type' => 'application/json']]);
            }
        }

        // 7. Enviar WhatsApps
        $link_lead_crm = "https://lease-in.odoo.com/web#id={$lead_id}&cids=1&model=crm.lead&view_type=form";
        $asesor_wsp = (substr($asesor['telefono'], 0, 2) !== '51') ? '51' . $asesor['telefono'] : $asesor['telefono'];
        $cliente_wsp = (substr($p_celular, 0, 2) !== '51') ? '51' . $p_celular : $p_celular;

        // -> Al Asesor
        $msg_asesor = "¡Acaba de llegar un nuevo lead para Alquiler desde el Cotizador de leasein.pe!\n\nNombre: $p_nombre\nCorreo: $p_correo\nCelular: $p_celular\nRUC: $p_ruc\nEmpleados: $p_empleados\nCantidad: $p_cantidad\nDuración: $p_duracion $p_tiempo\nProcesador: $proc_label\nTarifa mensual: $p_unit_price\nTarifa Total: $tarifa_total\nLink CRM: $link_lead_crm";
        wp_remote_post('http://23.22.91.55:3001/send-message', [
            'body' => json_encode(["phoneNumber" => $asesor_wsp, "message" => $msg_asesor]),
            'headers' => ['Content-Type' => 'application/json']
        ]);

        // -> Al Cliente (Cotización)
        $msg_cliente = "¡Hola $p_nombre,\n\nSoy {$asesor['nombre']}, ejecutivo comercial de Leasein 😊. Aquí te envío tu cotización. Si gustas puedes escribirme por aquí y te responderé a la brevedad 🙌🏻.";
        wp_remote_post('http://23.22.91.55:3002/send-quote', [
            'body' => json_encode([
                "asesorNumber" => $asesor_wsp,
                "clientNumber" => $cliente_wsp,
                "message" => $msg_cliente,
                "pdfUrl" => $pdf_url
            ]),
            'headers' => ['Content-Type' => 'application/json']
        ]);

        $this->log("Proceso finalizado exitosamente.");

        wp_send_json_success(array(
            'message' => 'Cotización procesada enviada a Odoo y WhatsApp.',
        ));
    }
}

// Inicializamos la clase
new Cotizador_Ajax();