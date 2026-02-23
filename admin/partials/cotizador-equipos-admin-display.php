<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
$settings_json = wp_json_encode( $settings );
if ( ! $settings_json ) {
    $settings_json = '{}';
}
?>

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>
  tailwind.config = {
    important: '.cotizador-admin-wrap',
    corePlugins: { preflight: false },
    theme: { extend: { fontFamily: { sans: ['Poppins', 'sans-serif'] } } }
  }
</script>

<div class="cotizador-admin-wrap p-6 text-slate-800 font-sans" x-data="cotizadorUI()" x-init="init()">
    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" @submit="beforeSubmit">
        <input type="hidden" name="action" value="ce_save_settings">
        <?php wp_nonce_field( 'ce_save_settings', 'ce_nonce' ); ?>
        <input type="hidden" name="ce_settings_json" x-ref="settingsJson">

        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h1 class="text-2xl font-semibold text-slate-900 m-0">Reglas y Precios del Cotizador</h1>
                <p class="text-sm text-slate-500 mt-1 m-0">Configura los pasos, periodos y matriz de precios del cotizador.</p>
            </div>
            <div class="flex flex-col sm:flex-row items-stretch gap-4">
                <div class="flex items-center gap-2 bg-slate-50 px-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors h-[44px]">
                    <span class="text-sm text-slate-600 font-medium">Moneda:</span>
                    <select x-model="formData.currency_code" @change="actualizarSimbolo()" class="bg-transparent border-none text-sm font-semibold text-blue-600 focus:ring-0 cursor-pointer outline-none w-full h-full">
                        <option value="PEN">Soles (S/.)</option>
                        <option value="USD">Dólares ($)</option>
                        <option value="COP">Pesos Col. ($)</option>
                    </select>
                </div>
                <button type="submit" class="h-[44px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-medium px-6 rounded-lg shadow-md transition-all border-none cursor-pointer flex items-center justify-center">
                    Guardar Cambios
                </button>
            </div>
        </div>

        <?php if ( isset( $_GET['settings-updated'] ) ) : ?>
            <div class="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">Cambios guardados correctamente.</div>
        <?php endif; ?>

        <div class="mb-6 bg-white border border-slate-200 rounded-xl p-2 inline-flex gap-2">
            <button type="button" @click="tab = 'textos'" class="px-4 py-2 text-sm font-medium rounded-lg transition-all border-none cursor-pointer" :class="tab === 'textos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 bg-transparent'">Textos de pasos</button>
            <button type="button" @click="tab = 'configuracion'" class="px-4 py-2 text-sm font-medium rounded-lg transition-all border-none cursor-pointer" :class="tab === 'configuracion' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 bg-transparent'">Configuración y precios</button>
        </div>

        <div x-show="tab === 'textos'" style="display: none;">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2">
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 1 - Procesador</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step1_eyebrow" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Encabezado">
                        <input type="text" x-model="formData.texts.step1_title" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Título">
                        <textarea x-model="formData.texts.step1_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg p-2.5 text-sm outline-none"></textarea>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 2 - Gama</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step2_eyebrow" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                        <input type="text" x-model="formData.texts.step2_title" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                        <textarea x-model="formData.texts.step2_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg p-2.5 text-sm outline-none"></textarea>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 3 - Periodo</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step3_eyebrow" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                        <input type="text" x-model="formData.texts.step3_title" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                        <textarea x-model="formData.texts.step3_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg p-2.5 text-sm outline-none"></textarea>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 4 - Resumen</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step4_eyebrow" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                        <input type="text" x-model="formData.texts.step4_title" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                        <textarea x-model="formData.texts.step4_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg p-2.5 text-sm outline-none"></textarea>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Botones y etiquetas</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <input type="text" x-model="formData.texts.btn_next" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Botón continuar">
                        <input type="text" x-model="formData.texts.btn_back" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Botón volver">
                        <input type="text" x-model="formData.texts.btn_finish" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Botón finalizar">
                        <input type="text" x-model="formData.texts.btn_restart" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Botón reiniciar">
                        <input type="text" x-model="formData.texts.btn_request" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Botón solicitud">
                        <input type="text" x-model="formData.texts.price_label" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Texto precio">
                        <input type="text" x-model="formData.texts.quantity_label" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Texto cantidad">
                        <input type="text" x-model="formData.texts.period_label" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Texto periodo">
                    </div>
                </div>
            </div>
        </div>

        <div x-show="tab === 'configuracion'" style="display: none;">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2">
                
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 1: Procesador</h2>
                    <div class="space-y-4">
                        <template x-for="(proc, index) in formData.processors" :key="index">
                            <div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                <div class="flex gap-4">
                                    <div class="flex-grow space-y-3">
                                        <div class="grid grid-cols-2 gap-2">
                                            <input type="text" x-model="proc.label" @change="updateMatrixIds('processors', index)" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Nombre interno (Ej: Core i5)">
                                            <input type="text" x-model="proc.front_label" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none text-blue-700 bg-blue-50/30" placeholder="Texto público (Ej: Aplicaciones estándar)">
                                        </div>
                                        <textarea x-model="proc.description" class="w-full min-h-[50px] border border-slate-200 rounded-lg p-2.5 text-sm outline-none text-slate-500" placeholder="Descripción breve..."></textarea>
                                        <p class="text-xs text-slate-400 m-0">ID: <span x-text="proc.id"></span></p>
                                    </div>
                                    <div class="flex items-center justify-center min-w-[40px]">
                                        <button type="button" x-show="!proc.confirmando" @click="proc.confirmando = true" :disabled="formData.processors.length === 1" class="text-red-500 hover:text-red-600 p-2 bg-transparent border-none cursor-pointer">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                        <div x-show="proc.confirmando" style="display: none;" class="flex flex-col gap-1">
                                            <button type="button" @click="removeItem('processors', index)" class="text-green-500 p-1 border-none bg-transparent cursor-pointer">✔️</button>
                                            <button type="button" @click="proc.confirmando = false" class="text-slate-500 p-1 border-none bg-transparent cursor-pointer">❌</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <button type="button" @click="addItem('processors')" class="mt-4 text-sm text-blue-600 bg-white border border-blue-200 py-2 px-4 rounded-lg cursor-pointer">+ Añadir Procesador</button>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 2: Gama</h2>
                    <div class="space-y-4">
                        <template x-for="(gama, index) in formData.gamas" :key="index">
                            <div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                <div class="flex gap-4">
                                    <div class="flex-grow space-y-3">
                                        <div class="grid grid-cols-2 gap-2">
                                            <input type="text" x-model="gama.label" @change="updateMatrixIds('gamas', index)" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Nombre interno (Ej: Gama baja)">
                                            <input type="text" x-model="gama.front_label" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none text-blue-700 bg-blue-50/30" placeholder="Texto público (Ej: Oficina constante)">
                                        </div>
                                        <textarea x-model="gama.description" class="w-full min-h-[50px] border border-slate-200 rounded-lg p-2.5 text-sm outline-none text-slate-500"></textarea>
                                        <p class="text-xs text-slate-400 m-0">ID: <span x-text="gama.id"></span></p>
                                    </div>
                                    <div class="flex items-center justify-center min-w-[40px]">
                                        <button type="button" x-show="!gama.confirmando" @click="gama.confirmando = true" :disabled="formData.gamas.length === 1" class="text-red-500 hover:text-red-600 p-2 bg-transparent border-none cursor-pointer">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                        <div x-show="gama.confirmando" style="display: none;" class="flex flex-col gap-1">
                                            <button type="button" @click="removeItem('gamas', index)" class="text-green-500 p-1 border-none bg-transparent cursor-pointer">✔️</button>
                                            <button type="button" @click="gama.confirmando = false" class="text-slate-500 p-1 border-none bg-transparent cursor-pointer">❌</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <button type="button" @click="addItem('gamas')" class="mt-4 text-sm text-blue-600 bg-white border border-blue-200 py-2 px-4 rounded-lg cursor-pointer">+ Añadir Gama</button>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 3: Unidades de Periodo (Base de cálculo)</h2>
                    <p class="text-sm text-slate-500 mb-4">Define la unidad base (ej: Día, Mes). El usuario ingresará la cantidad (ej: 5 días) en el cotizador.</p>
                    <div class="space-y-4">
                        <template x-for="(periodo, index) in formData.periods" :key="index">
                            <div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                <div class="flex gap-4 items-start">
                                    <div class="flex-grow space-y-2">
                                        <div class="grid grid-cols-2 gap-2">
                                            <input type="text" x-model="periodo.label" @change="updateMatrixIds('periods', index)" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none" placeholder="Interno (Ej: Mes)">
                                            <input type="text" x-model="periodo.front_label" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none text-blue-700 bg-blue-50/30" placeholder="Público plural (Ej: Meses)">
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-center min-w-[40px]">
                                        <button type="button" x-show="!periodo.confirmando" @click="periodo.confirmando = true" :disabled="formData.periods.length === 1" class="text-red-500 hover:text-red-600 p-2 bg-transparent border-none cursor-pointer">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                        <div x-show="periodo.confirmando" style="display: none;" class="flex flex-col gap-1">
                                            <button type="button" @click="removeItem('periods', index)" class="text-green-500 p-1 border-none bg-transparent cursor-pointer">✔️</button>
                                            <button type="button" @click="periodo.confirmando = false" class="text-slate-500 p-1 border-none bg-transparent cursor-pointer">❌</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <button type="button" @click="addItem('periods')" class="mt-4 text-sm text-blue-600 bg-white border border-blue-200 py-2 px-4 rounded-lg cursor-pointer">+ Añadir Unidad de Periodo</button>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2 flex flex-col">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Matriz de Precios Base</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left border-collapse">
                            <thead class="text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 pr-4 font-medium">Procesador</th>
                                    <th class="px-2 py-3 font-medium">Gama</th>
                                    <template x-for="periodo in formData.periods" :key="'head-'+periodo.id">
                                        <th class="px-2 py-3 font-medium text-center min-w-[170px]" x-text="periodo.label"></th>
                                    </template>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <template x-for="(proc, i1) in formData.processors" :key="'p'+i1">
                                    <template x-for="(gama, i2) in formData.gamas" :key="'g'+i1+i2">
                                        <tr class="hover:bg-slate-50 transition-colors">
                                            <td class="py-3 pr-4 font-medium text-slate-700" x-text="proc.label"></td>
                                            <td class="px-2 py-3 font-medium text-slate-700" x-text="gama.label"></td>
                                            <template x-for="(periodo, i3) in formData.periods" :key="'c'+i1+i2+i3">
                                                <td class="px-2 py-3">
                                                    <div class="relative flex items-center">
                                                        <span class="absolute left-3 text-slate-400 font-medium pointer-events-none" x-text="simboloDivisa"></span>
                                                        <input type="text" :value="getPrecioDisplay(proc.id, gama.id, periodo.id)" @input="handlePriceFormat(proc.id, gama.id, periodo.id, $event)" class="w-full border border-slate-200 rounded-lg p-2.5 pl-9 text-sm text-center outline-none focus:border-blue-500" placeholder="0.00">
                                                    </div>
                                                </td>
                                            </template>
                                        </tr>
                                    </template>
                                </template>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>

<script>
    document.addEventListener('alpine:init', () => {
        Alpine.data('cotizadorUI', () => ({
            tab: 'configuracion',
            initialSettings: <?php echo $settings_json; ?>,
            simboloDivisa: 'S/.',
            formData: { currency_code: 'PEN', currency_symbol: 'S/.', texts: {}, processors: [], gamas: [], periods: [], prices: {} },

            init() {
                const incoming = this.initialSettings && typeof this.initialSettings === 'object' ? this.initialSettings : {};
                this.formData.currency_code = incoming.currency_code || 'PEN';
                this.formData.texts = incoming.texts || {};
                
                const mapItems = (arr) => (Array.isArray(arr) ? arr : []).map(i => ({...i, confirmando: false}));
                this.formData.processors = mapItems(incoming.processors);
                this.formData.gamas = mapItems(incoming.gamas);
                this.formData.periods = mapItems(incoming.periods);
                this.formData.prices = incoming.prices || {};

                this.actualizarSimbolo();
                this.normalizarPrecios();
            },

            actualizarSimbolo() {
                const map = { PEN: 'S/.', USD: '$', COP: '$' };
                this.simboloDivisa = map[this.formData.currency_code] || 'S/.';
                this.formData.currency_symbol = this.simboloDivisa;
            },

            updateMatrixIds(type, index) {
                // Genera el ID onBlur/onChange, no onInput, para no estorbar.
                const item = this.formData[type][index];
                if (!item) return;
                const oldId = item.id;
                let newId = String(item.label).toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
                if (!newId) newId = 'temp_' + Date.now();
                if (oldId !== newId && this.formData.prices) {
                    item.id = newId;
                    // Mapeo simple de datos viejos a nuevos (simplificado aquí por espacio)
                    this.formData.prices = JSON.parse(JSON.stringify(this.formData.prices).replaceAll(`"${oldId}"`, `"${newId}"`));
                }
            },

            addItem(type) {
                this.formData[type].push({ id: type + '_' + Date.now(), label: '', front_label: '', description: '', confirmando: false });
                this.normalizarPrecios();
            },

            removeItem(type, index) {
                this.formData[type].splice(index, 1);
                this.normalizarPrecios();
            },

            getPrecioDisplay(p, g, t) {
                let val = this.formData.prices[p]?.[g]?.[t];
                return val ? parseFloat(val).toFixed(2) : '';
            },

            handlePriceFormat(p, g, t, event) {
                // Magia para escribir de derecha a izquierda 
                let raw = event.target.value.replace(/\D/g, '');
                if (!raw) {
                    this.formData.prices[p][g][t] = '';
                    event.target.value = '';
                    return;
                }
                let num = parseInt(raw, 10) / 100;
                let formatted = num.toFixed(2);
                this.formData.prices[p][g][t] = formatted;
                event.target.value = formatted;
            },

            normalizarPrecios() {
                const matriz = {};
                this.formData.processors.forEach(proc => {
                    matriz[proc.id] = {};
                    this.formData.gamas.forEach(gama => {
                        matriz[proc.id][gama.id] = {};
                        this.formData.periods.forEach(per => {
                            matriz[proc.id][gama.id][per.id] = this.formData.prices[proc.id]?.[gama.id]?.[per.id] || '';
                        });
                    });
                });
                this.formData.prices = matriz;
            },

            beforeSubmit() {
                this.normalizarPrecios();
                const toSave = JSON.parse(JSON.stringify(this.formData));
                ['processors', 'gamas', 'periods'].forEach(t => toSave[t].forEach(i => delete i.confirmando));
                this.$refs.settingsJson.value = JSON.stringify(toSave);
            }
        }));
    });
</script>