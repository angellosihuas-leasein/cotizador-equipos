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
    theme: {
      extend: {
        fontFamily: {
          sans: ['Poppins', 'sans-serif'],
        }
      }
    }
  }
</script>

<div class="cotizador-admin-wrap p-6 text-slate-800 font-sans" x-data="cotizadorUI()" x-init="init()">
    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" @submit="beforeSubmit">
        <input type="hidden" name="action" value="ce_save_settings">
        <?php wp_nonce_field( 'ce_save_settings', 'ce_nonce' ); ?>
        <input type="hidden" name="ce_settings_json" x-ref="settingsJson">

        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h1 class="text-2xl font-semibold text-slate-900 m-0">Reglas y Precios del Cotizador</h1>
                <p class="text-sm text-slate-500 mt-1 m-0">Configura los pasos, periodos y matriz de precios del cotizador.</p>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch gap-4">
                <div class="flex items-center gap-2 bg-slate-50 px-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors h-[44px]">
                    <span class="text-sm text-slate-600 font-medium">Moneda:</span>
                    <select x-model="formData.currency_code" @change="actualizarSimbolo()" class="bg-transparent border-none text-sm font-semibold text-blue-600 focus:ring-0 cursor-pointer outline-none w-full h-full">
                        <option value="PEN">Soles (S/.)</option>
                        <option value="USD">Dolares ($)</option>
                        <option value="COP">Pesos Col. ($)</option>
                    </select>
                </div>

                <button type="submit" class="h-[44px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white font-medium px-6 rounded-lg shadow-md hover:shadow-lg transition-all focus:ring-4 focus:ring-blue-100 border-none cursor-pointer flex items-center justify-center">
                    Guardar Cambios
                </button>
            </div>
        </div>

        <?php if ( isset( $_GET['settings-updated'] ) ) : ?>
            <div class="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
                Cambios guardados correctamente.
            </div>
        <?php endif; ?>

        <div class="mb-6 bg-white border border-slate-200 rounded-xl p-2 inline-flex gap-2">
            <button type="button" @click="tab = 'textos'" class="px-4 py-2 text-sm font-medium rounded-lg transition-all border-none cursor-pointer"
                :class="tab === 'textos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 bg-transparent'">
                Textos de pasos
            </button>
            <button type="button" @click="tab = 'configuracion'" class="px-4 py-2 text-sm font-medium rounded-lg transition-all border-none cursor-pointer"
                :class="tab === 'configuracion' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 bg-transparent'">
                Configuracion y precios
            </button>
        </div>

        <div x-show="tab === 'textos'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-2" x-transition:enter-end="opacity-100 translate-y-0" style="display: none;">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2">
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 1 - Procesador</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step1_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
                        <input type="text" x-model="formData.texts.step1_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Titulo">
                        <textarea x-model="formData.texts.step1_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtitulo"></textarea>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 2 - Gama</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step2_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
                        <input type="text" x-model="formData.texts.step2_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Titulo">
                        <textarea x-model="formData.texts.step2_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtitulo"></textarea>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 3 - Periodo</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step3_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
                        <input type="text" x-model="formData.texts.step3_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Titulo">
                        <textarea x-model="formData.texts.step3_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtitulo"></textarea>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 4 - Resumen</h2>
                    <div class="space-y-3">
                        <input type="text" x-model="formData.texts.step4_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
                        <input type="text" x-model="formData.texts.step4_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Titulo">
                        <textarea x-model="formData.texts.step4_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtitulo"></textarea>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Botones y etiquetas</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <input type="text" x-model="formData.texts.btn_next" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Boton continuar">
                        <input type="text" x-model="formData.texts.btn_back" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Boton volver">
                        <input type="text" x-model="formData.texts.btn_finish" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Boton finalizar">
                        <input type="text" x-model="formData.texts.btn_restart" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Boton reiniciar">
                        <input type="text" x-model="formData.texts.btn_request" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Boton solicitud">
                        <input type="text" x-model="formData.texts.price_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Texto precio">
                        <input type="text" x-model="formData.texts.quantity_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Texto cantidad">
                        <input type="text" x-model="formData.texts.period_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Texto periodo">
                    </div>
                </div>
            </div>
        </div>

        <div x-show="tab === 'configuracion'" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-2" x-transition:enter-end="opacity-100 translate-y-0" style="display: none;">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2">
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 1: Procesador (Textos Front)</h2>
                    <div class="space-y-4">
                        <template x-for="(proc, index) in formData.processors" :key="proc.id">
                            <div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                 x-transition:enter="transition ease-out duration-300"
                                 x-transition:enter-start="opacity-0 -translate-y-2"
                                 x-transition:enter-end="opacity-100 translate-y-0"
                                 x-transition:leave="transition ease-in duration-300"
                                 x-transition:leave-start="opacity-100"
                                 x-transition:leave-end="opacity-0 translate-x-4">
                                <div class="flex gap-4">
                                    <div class="flex-grow space-y-3">
                                        <input type="text" x-model="proc.label" @input="updateMatrixIds('processors', index)" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Ej: Core i5">
                                        <textarea x-model="proc.description" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Descripcion breve..."></textarea>
                                        <p class="text-xs text-slate-400 m-0">ID interno: <span x-text="proc.id"></span></p>
                                    </div>
                                    <div class="pt-1 text-center align-middle">
                                         <div class="relative w-full h-8 flex items-center justify-center">
                                            <button type="button" x-show="!proc.confirmando" x-transition.opacity.duration.200ms @click="proc.confirmando = true" :disabled="formData.processors.length === 1" class="absolute text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all p-2 bg-transparent border-none cursor-pointer inline-flex items-center justify-center rounded-lg">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                            <div x-show="proc.confirmando" style="display: none;" x-transition.opacity.duration.200ms class="absolute flex items-center justify-center gap-1">
                                                <button type="button" @click="removeItem('processors', index)" class="text-green-500 hover:text-green-600 hover:bg-green-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer" title="Confirmar">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                                                </button>
                                                <button type="button" @click="proc.confirmando = false" class="text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer" title="Cancelar">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div class="mt-4">
                        <button type="button" @click="addItem('processors')" class="text-sm font-medium bg-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white active:bg-blue-700 text-blue-600 py-2.5 px-5 rounded-lg border border-blue-200 hover:border-transparent active:scale-95 shadow-sm transition-all flex items-center gap-2 cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 group">
                            <svg class="w-4 h-4 text-blue-600 group-hover:text-white group-focus:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                            Anadir Procesador
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 2: Gama (Textos Front)</h2>
                    <div class="space-y-4">
                        <template x-for="(gama, index) in formData.gamas" :key="gama.id">
                            <div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                 x-transition:enter="transition ease-out duration-300"
                                 x-transition:enter-start="opacity-0 -translate-y-2"
                                 x-transition:enter-end="opacity-100 translate-y-0"
                                 x-transition:leave="transition ease-in duration-300"
                                 x-transition:leave-start="opacity-100"
                                 x-transition:leave-end="opacity-0 translate-x-4">
                                <div class="flex gap-4">
                                    <div class="flex-grow space-y-3">
                                        <input type="text" x-model="gama.label" @input="updateMatrixIds('gamas', index)" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Ej: Gama alta">
                                        <textarea x-model="gama.description" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Descripcion breve..."></textarea>
                                        <p class="text-xs text-slate-400 m-0">ID interno: <span x-text="gama.id"></span></p>
                                    </div>
                                     <div class="pt-1 text-center align-middle">
                                         <div class="relative w-full h-8 flex items-center justify-center">
                                            <button type="button" x-show="!gama.confirmando" x-transition.opacity.duration.200ms @click="gama.confirmando = true" :disabled="formData.gamas.length === 1" class="absolute text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all p-2 bg-transparent border-none cursor-pointer inline-flex items-center justify-center rounded-lg">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                            <div x-show="gama.confirmando" style="display: none;" x-transition.opacity.duration.200ms class="absolute flex items-center justify-center gap-1">
                                                <button type="button" @click="removeItem('gamas', index)" class="text-green-500 hover:text-green-600 hover:bg-green-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer" title="Confirmar">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                                                </button>
                                                <button type="button" @click="gama.confirmando = false" class="text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer" title="Cancelar">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div class="mt-4">
                        <button type="button" @click="addItem('gamas')" class="text-sm font-medium bg-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white active:bg-blue-700 text-blue-600 py-2.5 px-5 rounded-lg border border-blue-200 hover:border-transparent active:scale-95 shadow-sm transition-all flex items-center gap-2 cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 group">
                            <svg class="w-4 h-4 text-blue-600 group-hover:text-white group-focus:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                            Anadir Gama
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
                    <h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 3: Periodos de Alquiler</h2>
                    <div class="space-y-4">
                        <template x-for="(periodo, index) in formData.periods" :key="periodo.id">
                            <div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                 x-transition:enter="transition ease-out duration-300"
                                 x-transition:enter-start="opacity-0 -translate-y-2"
                                 x-transition:enter-end="opacity-100 translate-y-0"
                                 x-transition:leave="transition ease-in duration-300"
                                 x-transition:leave-start="opacity-100"
                                 x-transition:leave-end="opacity-0 translate-x-4">
                                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div class="md:col-span-4 space-y-2">
                                        <p class="text-xs font-medium text-slate-500 m-0">Nombre del periodo</p>
                                        <input type="text" x-model="periodo.label" @input="updateMatrixIds('periods', index)" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Ej: 1 mes">
                                    </div>
                                    <div class="md:col-span-7 space-y-2">
                                        <p class="text-xs font-medium text-slate-500 m-0">Descripcion del periodo</p>
                                        <textarea x-model="periodo.description" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Texto de apoyo para el front"></textarea>
                                        <p class="text-xs text-slate-400 m-0">ID interno: <span x-text="periodo.id"></span></p>
                                    </div>
                                    <div class="md:col-span-1 flex md:justify-end text-center align-middle mt-6">
                                         <div class="relative w-full h-8 flex items-center justify-center">
                                            <button type="button" x-show="!periodo.confirmando" x-transition.opacity.duration.200ms @click="periodo.confirmando = true" :disabled="formData.periods.length === 1" class="absolute text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all p-2 bg-transparent border-none cursor-pointer inline-flex items-center justify-center rounded-lg">
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                            <div x-show="periodo.confirmando" style="display: none;" x-transition.opacity.duration.200ms class="absolute flex items-center justify-center gap-1">
                                                <button type="button" @click="removeItem('periods', index)" class="text-green-500 hover:text-green-600 hover:bg-green-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer" title="Confirmar">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                                                </button>
                                                <button type="button" @click="periodo.confirmando = false" class="text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer" title="Cancelar">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div class="mt-4">
                        <button type="button" @click="addItem('periods')" class="text-sm font-medium bg-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white active:bg-blue-700 text-blue-600 py-2.5 px-5 rounded-lg border border-blue-200 hover:border-transparent active:scale-95 shadow-sm transition-all flex items-center gap-2 cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 group">
                            <svg class="w-4 h-4 text-blue-600 group-hover:text-white group-focus:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                            Anadir Periodo
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2 flex flex-col">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                        <h2 class="text-lg font-semibold text-slate-800 m-0">Matriz de Precios por Periodo (Combinaciones)</h2>
                    </div>
                    <div class="overflow-x-auto flex-grow">
                        <table class="w-full text-sm text-left border-collapse">
                            <thead class="text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 pr-4 font-medium w-1/5">Procesador</th>
                                    <th class="px-2 py-3 font-medium w-1/5">Gama</th>
                                    <template x-for="periodo in formData.periods" :key="'head-' + periodo.id">
                                        <th class="px-2 py-3 font-medium text-center min-w-[170px]">
                                            <span x-text="periodo.label || periodo.id"></span>
                                        </th>
                                    </template>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <template x-for="proc in formData.processors" :key="'proc-' + proc.id">
                                    <template x-for="gama in formData.gamas" :key="'row-' + proc.id + '-' + gama.id">
                                        <tr class="group hover:bg-slate-50 transition-colors">
                                            <td class="py-3 pr-4">
                                                <span class="font-medium text-slate-700" x-text="proc.label || proc.id"></span>
                                            </td>
                                            <td class="px-2 py-3">
                                                <span class="font-medium text-slate-700" x-text="gama.label || gama.id"></span>
                                            </td>

                                            <template x-for="periodo in formData.periods" :key="'cell-' + proc.id + '-' + gama.id + '-' + periodo.id">
                                                <td class="px-2 py-3">
                                                    <div class="relative flex items-center">
                                                        <span class="absolute left-3 text-slate-400 text-sm font-medium pointer-events-none" x-text="simboloDivisa"></span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            :value="getPrecio(proc.id, gama.id, periodo.id)"
                                                            @input="setPrecio(proc.id, gama.id, periodo.id, $event.target.value)"
                                                            @keydown="['e', 'E', '+', '-'].includes($event.key) && $event.preventDefault()"
                                                            class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 pl-9 text-sm shadow-sm outline-none text-center"
                                                            placeholder="0.00"
                                                        >
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

            formData: {
                currency_code: 'PEN',
                currency_symbol: 'S/.',
                texts: {},
                processors: [],
                gamas: [],
                periods: [],
                prices: {}
            },

            init() {
                const incoming = this.initialSettings && typeof this.initialSettings === 'object' ? this.initialSettings : {};
                const defaults = this.getDefaults();

                this.formData.currency_code = incoming.currency_code || this.inferCurrencyCode(incoming.currency_symbol);
                this.formData.texts = Object.assign({}, defaults.texts, incoming.texts || {});
                
                // Inicializa con confirmando: false para la UI
                this.formData.processors = this.normalizeItems(incoming.processors, 'proc', defaults.processors).map(i => ({...i, confirmando: false}));
                this.formData.gamas = this.normalizeItems(incoming.gamas, 'gama', defaults.gamas).map(i => ({...i, confirmando: false}));
                this.formData.periods = this.normalizeItems(incoming.periods, 'periodo', defaults.periods).map(i => ({...i, confirmando: false}));
                
                this.formData.prices = incoming.prices && typeof incoming.prices === 'object' ? incoming.prices : {};

                this.actualizarSimbolo();
                this.normalizarPrecios();
            },

            getDefaults() {
                return {
                    texts: {
                        step1_eyebrow: 'PASO 1 DE 4',
                        step1_title: 'Elige el procesador',
                        step1_subtitle: 'Selecciona la potencia base para tu equipo.',
                        step2_eyebrow: 'PASO 2 DE 4',
                        step2_title: 'Selecciona la gama',
                        step2_subtitle: 'Define el nivel de uso segun tu jornada.',
                        step3_eyebrow: 'PASO 3 DE 4',
                        step3_title: 'Elige el periodo de alquiler',
                        step3_subtitle: 'A mayor plazo, menor cuota mensual.',
                        step4_eyebrow: 'PASO 4 DE 4',
                        step4_title: 'Tu cotizacion esta lista',
                        step4_subtitle: 'Revisa el resumen antes de solicitar contacto.',
                        btn_next: 'Continuar',
                        btn_back: 'Volver',
                        btn_finish: 'Ver mi solucion',
                        btn_restart: 'Cambiar seleccion',
                        btn_request: 'Quiero la cotizacion en mi correo',
                        price_label: 'CUOTA MENSUAL / LAPTOP',
                        quantity_label: 'Cantidad de laptops',
                        period_label: 'Periodo de alquiler'
                    },
                    processors: [
                        { id: 'i5', label: 'Core i5', description: 'Ideal para tareas administrativas y productividad diaria.' },
                        { id: 'i7', label: 'Core i7', description: 'Mayor rendimiento para equipos con cargas exigentes.' }
                    ],
                    gamas: [
                        { id: 'baja', label: 'Gama baja', description: 'Funcionamiento estable para labores basicas.' },
                        { id: 'media', label: 'Gama media', description: 'Balance entre costo, potencia y durabilidad.' },
                        { id: 'alta', label: 'Gama alta', description: 'Maximo rendimiento para operaciones criticas.' }
                    ],
                    periods: [
                        { id: '1_semana', label: '1 semana', description: 'Periodo corto para proyectos puntuales.' },
                        { id: '1_mes', label: '1 mes', description: 'Ideal para pruebas y necesidades temporales.' },
                        { id: '12_meses', label: '12 meses', description: 'Cuota menor para planes de largo plazo.' }
                    ]
                };
            },

            inferCurrencyCode(symbol) {
                if (typeof symbol === 'string' && symbol.indexOf('S/') !== -1) return 'PEN';
                if (symbol === '$') return 'USD';
                return 'PEN';
            },

            actualizarSimbolo() {
                const simbolos = { PEN: 'S/.', USD: '$', COP: '$' };
                this.simboloDivisa = simbolos[this.formData.currency_code] || 'S/.';
                this.formData.currency_symbol = this.simboloDivisa;
            },

            normalizeItems(items, prefix, fallbackItems) {
                const source = Array.isArray(items) && items.length ? items : fallbackItems;
                const used = {};
                const normalized = [];

                source.forEach((item, index) => {
                    const label = this.cleanText(item && item.label ? item.label : '');
                    const description = this.cleanText(item && item.description ? item.description : '');
                    if (!label) return;

                    let id = this.cleanId(item && item.id ? item.id : '');
                    if (!id) {
                        id = this.cleanId(label);
                    }
                    if (!id) {
                        id = prefix + '_' + (index + 1);
                    }

                    const baseId = id;
                    let suffix = 2;
                    while (used[id]) {
                        id = baseId + '_' + suffix;
                        suffix += 1;
                    }
                    used[id] = true;

                    normalized.push({
                        id: id,
                        label: label,
                        description: description
                    });
                });

                if (!normalized.length) {
                    return JSON.parse(JSON.stringify(fallbackItems));
                }

                return normalized;
            },

            cleanText(value) {
                return String(value || '').trim();
            },

            cleanId(value) {
                return String(value || '')
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9_ -]/g, '')
                    .replace(/\s+/g, '_')
                    .replace(/-+/g, '_')
                    .replace(/_+/g, '_');
            },

             updateMatrixIds(type, index) {
                const item = this.formData[type][index];
                if (!item) return;

                const oldId = item.id;
                let newId = this.cleanId(item.label);
                
                // Si está vacío, mantener un ID temporal seguro
                if (!newId) newId = 'temp_' + Date.now();

                // Asegurar que el nuevo ID sea único
                const existingIds = this.formData[type].filter((_, i) => i !== index).map(i => i.id);
                if (existingIds.includes(newId)) {
                    let suffix = 2;
                    while (existingIds.includes(`${newId}_${suffix}`)) {
                        suffix++;
                    }
                    newId = `${newId}_${suffix}`;
                }

                item.id = newId;

                // Actualizar las llaves en la matriz de precios si el ID cambió
                if (oldId !== newId && this.formData.prices) {
                    if (type === 'processors') {
                         if(this.formData.prices[oldId]) {
                             this.formData.prices[newId] = this.formData.prices[oldId];
                             delete this.formData.prices[oldId];
                         }
                    } else if (type === 'gamas') {
                        Object.keys(this.formData.prices).forEach(procId => {
                            if(this.formData.prices[procId] && this.formData.prices[procId][oldId]) {
                                this.formData.prices[procId][newId] = this.formData.prices[procId][oldId];
                                delete this.formData.prices[procId][oldId];
                            }
                        });
                    } else if (type === 'periods') {
                         Object.keys(this.formData.prices).forEach(procId => {
                            Object.keys(this.formData.prices[procId] || {}).forEach(gamaId => {
                                 if(this.formData.prices[procId][gamaId] && typeof this.formData.prices[procId][gamaId][oldId] !== 'undefined') {
                                     this.formData.prices[procId][gamaId][newId] = this.formData.prices[procId][gamaId][oldId];
                                     delete this.formData.prices[procId][gamaId][oldId];
                                 }
                            });
                        });
                    }
                }
            },

            addItem(type) {
                const target = this.formData[type];
                if (!Array.isArray(target)) return;

                const prefixMap = { processors: 'proc', gamas: 'gama', periods: 'periodo' };
                const prefix = prefixMap[type] || 'item';
                let idx = target.length + 1;
                let candidate = prefix + '_' + idx;
                const existing = new Set(target.map((item) => item.id));
                while (existing.has(candidate)) {
                    idx += 1;
                    candidate = prefix + '_' + idx;
                }

                target.push({
                    id: candidate,
                    label: '',
                    description: '',
                    confirmando: false
                });

                this.normalizarPrecios();
            },

            removeItem(type, index) {
                const target = this.formData[type];
                if (!Array.isArray(target) || target.length <= 1) return;
                
                const itemToRemove = target[index];
                
                // Limpiar de la matriz de precios antes de borrar
                if(itemToRemove && this.formData.prices) {
                    const id = itemToRemove.id;
                    if (type === 'processors') {
                        delete this.formData.prices[id];
                    } else if (type === 'gamas') {
                         Object.keys(this.formData.prices).forEach(procId => {
                            if(this.formData.prices[procId]) {
                                delete this.formData.prices[procId][id];
                            }
                        });
                    } else if (type === 'periods') {
                         Object.keys(this.formData.prices).forEach(procId => {
                            Object.keys(this.formData.prices[procId] || {}).forEach(gamaId => {
                                 if(this.formData.prices[procId][gamaId]) {
                                     delete this.formData.prices[procId][gamaId][id];
                                 }
                            });
                        });
                    }
                }

                target.splice(index, 1);
                this.normalizarPrecios();
            },

            getPrecio(processorId, gamaId, periodId) {
                if (
                    !this.formData.prices[processorId] ||
                    !this.formData.prices[processorId][gamaId] ||
                    typeof this.formData.prices[processorId][gamaId][periodId] === 'undefined'
                ) {
                    return '';
                }
                return this.formData.prices[processorId][gamaId][periodId];
            },

            setPrecio(processorId, gamaId, periodId, value) {
                const val = this.limitarDecimales(value);
                if (!this.formData.prices[processorId]) this.formData.prices[processorId] = {};
                if (!this.formData.prices[processorId][gamaId]) this.formData.prices[processorId][gamaId] = {};
                this.formData.prices[processorId][gamaId][periodId] = val;
            },

            limitarDecimales(valor) {
                if (valor === null || typeof valor === 'undefined') return '';
                const stringVal = valor.toString().replace(',', '.');
                const regex = /^\d+(?:\.\d{0,2})?/;
                const match = stringVal.match(regex);
                return match ? match[0] : '';
            },

            normalizarPrecios() {
                const matriz = {};

                this.formData.processors.forEach((proc) => {
                    matriz[proc.id] = {};
                    this.formData.gamas.forEach((gama) => {
                        matriz[proc.id][gama.id] = {};
                        this.formData.periods.forEach((periodo) => {
                            const actual = this.getPrecio(proc.id, gama.id, periodo.id);
                            matriz[proc.id][gama.id][periodo.id] = actual;
                        });
                    });
                });

                this.formData.prices = matriz;
            },

            beforeSubmit() {
                this.actualizarSimbolo();
                this.normalizarPrecios();
                
                // Limpiar la propiedad 'confirmando' antes de guardar
                const dataToSave = JSON.parse(JSON.stringify(this.formData));
                ['processors', 'gamas', 'periods'].forEach(type => {
                     dataToSave[type].forEach(item => {
                         delete item.confirmando;
                     });
                });

                this.$refs.settingsJson.value = JSON.stringify(dataToSave);
            }
        }));
    });
</script>