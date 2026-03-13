<?php
// Si se intenta acceder directamente al archivo, salimos.
if (!defined('ABSPATH')) {
    exit;
}

class Cotizador_Ajax {

    public function __construct() {
        add_action('wp_ajax_nopriv_cotizador_validar_ruc', array($this, 'validar_ruc'));
        add_action('wp_ajax_cotizador_validar_ruc', array($this, 'validar_ruc'));

        add_action('wp_ajax_nopriv_cotizador_enviar', array($this, 'enviar_cotizacion'));
        add_action('wp_ajax_cotizador_enviar', array($this, 'enviar_cotizacion'));
    }

    private function log($message) {
        $log_file = WP_CONTENT_DIR . '/debug_cotizador.log';
        file_put_contents($log_file, date('Y-m-d H:i:s') . " - " . $message . "\n", FILE_APPEND);
    }

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

    public function validar_ruc() {
        if (!check_ajax_referer('cotizador_nonce_action', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Error de seguridad. Recarga la página.'));
        }
        $ruc = isset($_POST['ruc']) ? sanitize_text_field($_POST['ruc']) : '';
        if (empty($ruc)) wp_send_json_error(array('message' => 'RUC es requerido'));

        $url = 'https://api.decolecta.com/v1/sunat/ruc/full?numero=' . $ruc;
        $args = array('timeout' => 30, 'headers' => array('Authorization' => 'Bearer sk_4714.9qm5vk8GisuzWN88MtYeFvyhr74veZKX', 'Content-Type' => 'application/json'));
        $response = wp_remote_get($url, $args);

        if (is_wp_error($response)) { wp_send_json_error(array('message' => 'Error al validar RUC: ' . $response->get_error_message())); }
        $http_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);

        if ($http_code === 200 && !empty($result)) {
            wp_send_json_success(array('data' => $result));
        } else {
            wp_send_json_error(array('message' => 'Error en la API, código HTTP: ' . $http_code));
        }
    }

    public function enviar_cotizacion() {
        if (!check_ajax_referer('cotizador_nonce_action', 'nonce', false)) {
            wp_send_json_error(array('message' => 'Error de seguridad. Recarga la página.'));
        }

        $this->log("=== NUEVA PETICIÓN INICIADA (MODO TURBO) ===");

        // ----------------------------------------------------------------------
        // 🚀 TRUCO DE VELOCIDAD: Le decimos al navegador "¡Todo listo!" al instante
        // para que la ruedita de carga desaparezca en menos de 1 segundo.
        // ----------------------------------------------------------------------
        echo wp_json_encode(array('success' => true, 'data' => array('message' => 'Cotización procesada exitosamente.')));
        
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request(); // Cierra la conexión pero PHP sigue corriendo
        } elseif (function_exists('litespeed_finish_request')) {
            litespeed_finish_request();
        }

        // ======================================================================
        // A PARTIR DE AQUÍ TODO SE EJECUTA EN SEGUNDO PLANO (INVISBILE AL USUARIO)
        // ======================================================================

        // 1. Recoger datos
        $p_nombre   = sanitize_text_field($_POST['nombre'] ?? '');
        $p_correo   = sanitize_email($_POST['correo'] ?? '');
        $p_ruc      = sanitize_text_field($_POST['ruc'] ?? '');
        $p_celular  = sanitize_text_field($_POST['telefono'] ?? '');
        
        $procesador_id = sanitize_text_field($_POST['procesador_id'] ?? '');
        $gama_id       = sanitize_text_field($_POST['gama_id'] ?? '');
        $p_cantidad    = intval($_POST['cantidad'] ?? 1);
        $p_duracion    = intval($_POST['tiempo_valor'] ?? 1);
        $p_tiempo      = sanitize_text_field($_POST['tiempo_unidad'] ?? '');

        // Nuevos campos para Notas
        $addon_ram_id     = sanitize_text_field($_POST['addon_ram_id'] ?? '');
        $addon_storage_id = sanitize_text_field($_POST['addon_storage_id'] ?? '');

        // 2. Extraer configuración
        $settings = Cotizador_Equipos_Settings::get();
        $matched_period_id = '';
        foreach ($settings['periods'] as $p) {
            if ($p['unit'] === $p_tiempo && $p_duracion >= $p['min_value'] && ($p['max_value'] === '' || $p_duracion <= intval($p['max_value']))) {
                $matched_period_id = $p['id']; break;
            }
        }

        $p_unit_price = 0;
        if ($matched_period_id && isset($settings['prices'][$procesador_id][$gama_id][$matched_period_id])) {
            $p_unit_price = floatval($settings['prices'][$procesador_id][$gama_id][$matched_period_id]);
        }

        // Buscar el periodo correspondiente para los adicionales
        $matched_addon_period_id = '';
        if (!empty($settings['addon_periods'])) {
            foreach ($settings['addon_periods'] as $p) {
                if ($p['unit'] === $p_tiempo && $p_duracion >= $p['min_value'] && ($p['max_value'] === '' || $p_duracion <= intval($p['max_value']))) {
                    $matched_addon_period_id = $p['id']; break;
                }
            }
        }

        // 3. Armar el texto para la pestaña "NOTAS" de Odoo y sumar los costos/capacidades
        $texto_adicionales = "";
        
        $total_ram = 16; // RAM Base
        $total_storage_gb = 512; // Almacenamiento Base GB

        // Estos son los valores BASE rígidos que irán a Odoo para no romper sus validaciones
        $p_ram_odoo = 16; 
        $p_almacenamiento_odoo = "Sólido 512GB";

        if (!empty($addon_ram_id) || !empty($addon_storage_id)) {
            $texto_adicionales .= "\n\n=== ADICIONALES SELECCIONADOS ===";
            
            // Procesamiento de RAM adicional
            if (!empty($addon_ram_id) && !empty($settings['addons']['ram'])) {
                foreach ($settings['addons']['ram'] as $ram) {
                    if ($ram['id'] === $addon_ram_id) {
                        $r_price = isset($ram['prices'][$matched_addon_period_id]) ? floatval($ram['prices'][$matched_addon_period_id]) : (isset($ram['price']) ? floatval($ram['price']) : 0);
                        $p_unit_price += $r_price;
                        $texto_adicionales .= "\n- RAM Extra: " . $ram['label'] . " (+S/." . $r_price . ")";
                        
                        // Extraer números y sumar a la RAM Total para el PDF
                        preg_match('/(\d+)/', $ram['label'], $matches);
                        $extra_ram = isset($matches[1]) ? intval($matches[1]) : 0;
                        $total_ram += $extra_ram;
                    }
                }
            }
            
            // Procesamiento de Almacenamiento adicional
            if (!empty($addon_storage_id) && !empty($settings['addons']['storage'])) {
                foreach ($settings['addons']['storage'] as $sto) {
                    if ($sto['id'] === $addon_storage_id) {
                        $s_price = isset($sto['prices'][$matched_addon_period_id]) ? floatval($sto['prices'][$matched_addon_period_id]) : (isset($sto['price']) ? floatval($sto['price']) : 0);
                        $p_unit_price += $s_price;
                        $texto_adicionales .= "\n- Almacenamiento Extra: " . $sto['label'] . " (+S/." . $s_price . ")";
                        
                        // Extraer números y tipo de unidad (GB o TB) para sumar al PDF
                        preg_match('/(\d+)\s*(GB|TB)/i', $sto['label'], $matches);
                        $extra_sto = isset($matches[1]) ? intval($matches[1]) : 0;
                        $unit = isset($matches[2]) ? strtoupper($matches[2]) : '';
                        if ($unit === 'TB') {
                            $extra_sto *= 1024; // Convertir TB a GB
                        }
                        $total_storage_gb += $extra_sto;
                    }
                }
            }
        }

        // Formatear los strings que viajan a LA BASE DE DATOS LOCAL (Generarán el PDF hermoso)
        $p_ram_str_pdf = "{$total_ram}GB RAM";

        if ($total_storage_gb >= 1024) {
            $tb = $total_storage_gb / 1024;
            $formatted_tb = (floor($tb) == $tb) ? $tb : number_format($tb, 1, '.', '');
            $p_almacenamiento_pdf = "Sólido {$formatted_tb}TB";
        } else {
            $p_almacenamiento_pdf = "Sólido {$total_storage_gb}GB";
        }

        $proc_label = 'Laptop Estándar';
        foreach ($settings['processors'] as $proc) {
            if ($proc['id'] === $procesador_id) { $proc_label = $proc['label']; break; }
        }

        $odoo_proc = 'Intel Core i5'; // Default
        if (stripos($proc_label, 'i7') !== false) { $odoo_proc = 'Intel Core i7'; } 
        elseif (stripos($proc_label, 'm1') !== false || stripos($proc_label, 'mac') !== false) { $odoo_proc = 'Chip M1'; }

        // Fijos de tu lógica
        $p_empleados = '1-10 empleados';
        $p_rol = 'No especificado';
        $p_so = 'windows';
        $p_fuente = 'cotizador_web';
        $hasta12 = 1;
        $masde12 = 0;
        $tarifa_total = $p_cantidad * $p_unit_price;

        $descripcion_odoo = "Rol: " . $p_rol . "\nNumero de empleados: " . $p_empleados . $texto_adicionales;

        // 4. Base de Datos Local (Insertamos $p_ram_str_pdf y $p_almacenamiento_pdf para el PDF)
        $mydb = new wpdb('root', 'L@b0ratR1o.', 'leasein_data', '127.0.0.1');
        
        $asesores_esta_web = ['Josselyn Cochachin'];
        $asesor_data = $mydb->get_results("SELECT id, nombre, correo, firma, cargo, odoo_user_id, odoo_partner_id, telefono FROM asesores", ARRAY_A);
        if($asesor_data) { $asesor_data = array_filter($asesor_data, function($item) use ($asesores_esta_web) { return in_array($item['nombre'], $asesores_esta_web); }); }
        $asesor = !empty($asesor_data) ? reset($asesor_data) : ['id' => 1, 'nombre' => 'Josselyn Cochachin', 'odoo_user_id' => 1, 'telefono' => '51901547663'];

        $sql = $mydb->prepare("INSERT INTO leads VALUES (
            DEFAULT, %s, %s, %s, NULL, %s, %s, %s, %s, %d, %d, %s, NULL, NULL, %s, %s, %s, NULL, NULL, %f, '0', %s, NULL, %s, NOW(), NULL, '1', '1', '0', '0', '', '', '', '', ''
        )", 
        $p_nombre, $p_correo, $p_ruc, $p_celular, $p_rol, $p_empleados, $proc_label, $p_cantidad, $p_duracion, $p_tiempo, $p_so, $p_ram_str_pdf, $p_almacenamiento_pdf, $p_unit_price, $asesor['nombre'], $p_fuente);
        $mydb->query($sql);
        $ide = $mydb->insert_id;

        $pdf_url = 'https://leasein.pe/getpdf/download.php?code=' . urlencode($this->myCrypto('encrypt', (string)$ide));

        // 5. Odoo Payload (Enviamos los valores base rígidos para evitar rechazo + la descripcion_odoo)
        $odoo_url = 'https://lease-in.odoo.com/jsonrpc';
        $odoo_user  = 'danielvdml-addons-leasein-master-7160506';
        $odoo_token = 'f8d380f7ec8c20b0e916e8ce4cebe7b684bb4f7a';

        $json_data = [
            "jsonrpc" => "2.0",
            "method" => "call",
            "params" => [
                "service" => "object", "method" => "execute", "args" => [
                    $odoo_user, 2, $odoo_token, "crm.lead", "create", [
                        "name" => "Cotizador - leasein.pe | " . $p_nombre,
                        "type" => "lead", "email_from" => $p_correo, "phone" => $p_celular, "stage_id" => 1, "contact_name" => $p_nombre,
                        "x_studio_tipo_de_documento" => "RUC", "x_studio_numero_de_documento" => $p_ruc, "partner_name" => "",
                        "user_id" => (int)$asesor['odoo_user_id'], "asesor_phone" => $asesor['telefono'], "numero_empleados" => $p_empleados,
                        "team_id" => 46, "email_cc" => "conversemos@leasein.pe",
                        "description" => $descripcion_odoo, // ACÁ VIAJAN LAS NOTAS Y ADICIONALES PARA MOSTRARSE EN LA PESTAÑA ODOO
                        "x_studio_periodo" => ucfirst($p_tiempo), "x_studio_period_time" => $p_duracion, "x_studio_system" => $p_so,
                        "x_studio_qty" => $p_cantidad, "x_studio_procesador" => $odoo_proc, "x_studio_ram" => $p_ram_odoo, // Va el BASE
                        "x_studio_storage" => $p_almacenamiento_odoo, // Va el BASE
                        "x_studio_met_us" => $p_fuente, "x_studio_costo_unit" => $p_unit_price,
                        "x_studio_costo_total" => $tarifa_total, "formulario" => false, "lead_canal" => 2, "lead_fuente" => 2, "campaign_id" => 36,
                        "cotizador_hasta_12" => $hasta12, "cotizador_mas_de_12" => $masde12, "leasing_operativo" => false, "url_pdf" => $pdf_url
                    ]
                ]
            ]
        ];

        $resp_odoo = wp_remote_post($odoo_url, ['body' => json_encode($json_data), 'headers' => ['Content-Type' => 'application/json']]);
        
        $lead_id = null;
        if (!is_wp_error($resp_odoo)) {
            $odoo_body = json_decode(wp_remote_retrieve_body($resp_odoo), true);
            $lead_id = $odoo_body['result'] ?? null;
            if ($lead_id && is_numeric($lead_id)) {
                $nuevo_name = sprintf('OPT-%d | Cotizador - leasein.pe', (int)$lead_id);
                $rename_payload = ["jsonrpc" => "2.0", "method" => "call", "params" => ["service" => "object", "method" => "execute_kw", "args" => [$odoo_user, 2, $odoo_token, "crm.lead", "write", [[(int)$lead_id], ["name" => $nuevo_name]]], "kwargs" => ["context" => ["skip_opt_name" => true]]]];
                wp_remote_post($odoo_url, ['body' => json_encode($rename_payload), 'headers' => ['Content-Type' => 'application/json'], 'blocking' => false]);
            }
        }

        // 6. WhatsApps 
        $link_lead_crm = "https://lease-in.odoo.com/web#id={$lead_id}&cids=1&model=crm.lead&view_type=form";
        $asesor_wsp = (substr($asesor['telefono'], 0, 2) !== '51') ? '51' . $asesor['telefono'] : $asesor['telefono'];
        $cliente_wsp = (substr($p_celular, 0, 2) !== '51') ? '51' . $p_celular : $p_celular;

        $msg_asesor = "¡Acaba de llegar un nuevo lead para Alquiler desde el Cotizador de leasein.pe!\n\nNombre: $p_nombre\nCorreo: $p_correo\nCelular: $p_celular\nRUC: $p_ruc\nEmpleados: $p_empleados\nCantidad: $p_cantidad\nDuración: $p_duracion $p_tiempo\nProcesador: $proc_label\nTarifa mensual: $p_unit_price\nTarifa Total: $tarifa_total\nLink CRM: $link_lead_crm";
        wp_remote_post('http://23.22.91.55:3001/send-message', ['body' => json_encode(["phoneNumber" => $asesor_wsp, "message" => $msg_asesor]), 'headers' => ['Content-Type' => 'application/json'], 'blocking' => false]);

        $msg_cliente = "¡Hola $p_nombre,\n\n Soy {$asesor['nombre']}, ejecutivo comercial de Leasein 😊. Aquí te envío tu cotización. Si gustas puedes escribirme por aquí y te responderé a la brevedad 🙌🏻.";
        wp_remote_post('http://23.22.91.55:3002/send-quote', ['body' => json_encode(["asesorNumber" => $asesor_wsp, "clientNumber" => $cliente_wsp, "message" => $msg_cliente, "pdfUrl" => $pdf_url]), 'headers' => ['Content-Type' => 'application/json'], 'blocking' => false]);

        $this->log("=== FIN DE LA PETICIÓN EN SEGUNDO PLANO ===");
        exit; // Termina la ejecución silenciosa
    }
}
new Cotizador_Ajax();