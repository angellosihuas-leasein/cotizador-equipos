<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$settings_json = wp_json_encode( $settings );
if ( ! $settings_json ) {
	$settings_json = '{}';
}
?>

<div class="cotizador-admin-wrap p-6 text-slate-800 font-sans" x-data="cotizadorUI()" x-init="init()">
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" @submit="beforeSubmit">
		<input type="hidden" name="action" value="ce_save_settings">
		<?php wp_nonce_field( 'ce_save_settings', 'ce_nonce' ); ?>
		<input type="hidden" name="ce_settings_json" x-ref="settingsJson">

		<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
			<div>
				<h1 class="text-2xl font-semibold text-slate-900 m-0">Reglas y Precios del Cotizador</h1>
				<p class="text-sm text-slate-500 mt-1 m-0">Configura los pasos del formulario, periodos y combinaciones de precio.</p>
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
				Configuración y precios
			</button>
		</div>

		<div x-show="tab === 'textos'" x-transition.opacity.duration.200ms style="display: none;">
			<div class="grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2">
				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 1 - Procesador</h2>
					<div class="space-y-3">
						<input type="text" x-model="formData.texts.step1_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
						<input type="text" x-model="formData.texts.step1_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Título">
						<textarea x-model="formData.texts.step1_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtítulo"></textarea>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 2 - Gama</h2>
					<div class="space-y-3">
						<input type="text" x-model="formData.texts.step2_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
						<input type="text" x-model="formData.texts.step2_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Título">
						<textarea x-model="formData.texts.step2_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtítulo"></textarea>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 3 - Tiempo</h2>
					<div class="space-y-3">
						<input type="text" x-model="formData.texts.step3_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
						<input type="text" x-model="formData.texts.step3_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Título">
						<textarea x-model="formData.texts.step3_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtítulo"></textarea>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 4 - Resumen</h2>
					<div class="space-y-3">
						<input type="text" x-model="formData.texts.step4_eyebrow" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Encabezado">
						<input type="text" x-model="formData.texts.step4_title" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Título">
						<textarea x-model="formData.texts.step4_subtitle" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Subtítulo"></textarea>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Botones, WhatsApp y acceso rápido</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
						<input type="text" x-model="formData.texts.btn_next" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Botón continuar">
						<input type="text" x-model="formData.texts.btn_back" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Botón volver">
						<input type="text" x-model="formData.texts.btn_finish" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Botón finalizar">
						<input type="text" x-model="formData.texts.btn_restart" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Botón reiniciar">
						<input type="text" x-model="formData.texts.btn_request" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Botón solicitud">
						<input type="text" x-model="formData.texts.price_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Etiqueta precio">
						<input type="text" x-model="formData.texts.quantity_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Etiqueta cantidad">
						<input type="text" x-model="formData.texts.period_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Etiqueta periodo">
						<input type="text" x-model="formData.texts.whatsapp_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Texto opción WhatsApp">
						<input type="text" x-model="formData.texts.whatsapp_desc" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Descripción opción WhatsApp">
						<input type="text" x-model="formData.texts.whatsapp_url" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="URL WhatsApp">
						<input type="text" x-model="formData.texts.manual_link" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Texto enlace acceso rápido">
						<input type="text" x-model="formData.texts.manual_title" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Título panel rápido">
						<input type="text" x-model="formData.texts.manual_apply" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Botón panel rápido">
					</div>
				</div>
			</div>
		</div>

		<div x-show="tab === 'configuracion'" x-transition.opacity.duration.200ms style="display: none;">
			<div class="grid grid-cols-1 xl:grid-cols-2 gap-8 pr-2">
				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 1: Procesador</h2>
					<div class="space-y-4">
						<template x-for="(proc, index) in formData.processors" :key="proc.id">
							<div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
								<div class="flex gap-4">
									<div class="flex-grow space-y-3">
										<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
											<input type="text" x-model="proc.label" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Interno (ej: Core i5)">
											<input type="text" x-model="proc.front_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none text-blue-700 bg-blue-50/30" placeholder="Texto público">
										</div>
										<textarea x-model="proc.description" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Descripción breve..."></textarea>
										<p class="text-xs text-slate-400 m-0">ID interno: <span x-text="proc.id"></span></p>
									</div>

									<div class="relative w-10 h-10 flex items-center justify-center">
										<button type="button" x-show="!proc.confirmando" x-transition.opacity.duration.200ms @click="proc.confirmando = true"
											:disabled="formData.processors.length === 1"
											class="absolute text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all p-2 bg-transparent border-none cursor-pointer inline-flex items-center justify-center rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
										</button>
										<div x-show="proc.confirmando" style="display: none;" x-transition.opacity.duration.200ms class="absolute flex items-center justify-center gap-1">
											<button type="button" @click="removeItem('processors', index)" class="text-green-500 hover:bg-green-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
											</button>
											<button type="button" @click="proc.confirmando = false" class="text-red-500 hover:bg-red-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
											</button>
										</div>
									</div>
								</div>
							</div>
						</template>
					</div>
					<div class="mt-4">
						<button type="button" @click="addItem('processors')" class="text-sm font-medium bg-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white active:bg-blue-700 text-blue-600 py-2.5 px-5 rounded-lg border border-blue-200 hover:border-transparent active:scale-95 shadow-sm transition-all flex items-center gap-2 cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 group">
							<svg class="w-4 h-4 text-blue-600 group-hover:text-white group-focus:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
							Añadir Procesador
						</button>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 2: Gama</h2>
					<div class="space-y-4">
						<template x-for="(gama, index) in formData.gamas" :key="gama.id">
							<div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
								<div class="flex gap-4">
									<div class="flex-grow space-y-3">
										<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
											<input type="text" x-model="gama.label" class="w-full font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Interno (ej: Gama media)">
											<input type="text" x-model="gama.front_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none text-blue-700 bg-blue-50/30" placeholder="Texto público">
										</div>
										<textarea x-model="gama.description" class="w-full min-h-[50px] border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none resize-y text-slate-500" placeholder="Descripción breve..."></textarea>
										<p class="text-xs text-slate-400 m-0">ID interno: <span x-text="gama.id"></span></p>
									</div>

									<div class="relative w-10 h-10 flex items-center justify-center">
										<button type="button" x-show="!gama.confirmando" x-transition.opacity.duration.200ms @click="gama.confirmando = true"
											:disabled="formData.gamas.length === 1"
											class="absolute text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all p-2 bg-transparent border-none cursor-pointer inline-flex items-center justify-center rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
										</button>
										<div x-show="gama.confirmando" style="display: none;" x-transition.opacity.duration.200ms class="absolute flex items-center justify-center gap-1">
											<button type="button" @click="removeItem('gamas', index)" class="text-green-500 hover:bg-green-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
											</button>
											<button type="button" @click="gama.confirmando = false" class="text-red-500 hover:bg-red-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
											</button>
										</div>
									</div>
								</div>
							</div>
						</template>
					</div>
					<div class="mt-4">
						<button type="button" @click="addItem('gamas')" class="text-sm font-medium bg-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white active:bg-blue-700 text-blue-600 py-2.5 px-5 rounded-lg border border-blue-200 hover:border-transparent active:scale-95 shadow-sm transition-all flex items-center gap-2 cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 group">
							<svg class="w-4 h-4 text-blue-600 group-hover:text-white group-focus:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
							Añadir Gama
						</button>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Paso 3: Reglas de periodos</h2>
					<p class="text-sm text-slate-500 mb-4">Define reglas por rango. Ejemplo: unidad semanas, min 2, max 4.</p>

					<div class="space-y-4">
						<template x-for="(periodo, index) in formData.periods" :key="periodo.id">
							<div class="p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
								<div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
									<div class="md:col-span-3 space-y-2">
										<p class="text-xs text-slate-500 m-0">Nombre interno</p>
										<input type="text" x-model="periodo.label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none">
									</div>
									<div class="md:col-span-3 space-y-2">
										<p class="text-xs text-slate-500 m-0">Texto público</p>
										<input type="text" x-model="periodo.front_label" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none text-blue-700 bg-blue-50/30">
									</div>
									<div class="md:col-span-2 space-y-2">
										<p class="text-xs text-slate-500 m-0">Unidad</p>
										<select x-model="periodo.unit" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none bg-white">
											<option value="dias">Días</option>
											<option value="semanas">Semanas</option>
											<option value="meses">Meses</option>
										</select>
									</div>
									<div class="md:col-span-1 space-y-2">
										<p class="text-xs text-slate-500 m-0">Mín</p>
										<input type="number" min="1" step="1" x-model="periodo.min_value" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none">
									</div>
									<div class="md:col-span-2 space-y-2">
										<p class="text-xs text-slate-500 m-0">Máx (opcional)</p>
										<input type="number" min="1" step="1" x-model="periodo.max_value" class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 text-sm shadow-sm outline-none" placeholder="Sin límite">
									</div>
									<div class="md:col-span-1 relative w-10 h-10 md:mt-6 flex items-center justify-center">
										<button type="button" x-show="!periodo.confirmando" x-transition.opacity.duration.200ms @click="periodo.confirmando = true"
											:disabled="formData.periods.length === 1"
											class="absolute text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all p-2 bg-transparent border-none cursor-pointer inline-flex items-center justify-center rounded-lg disabled:opacity-30 disabled:cursor-not-allowed">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
										</button>
										<div x-show="periodo.confirmando" style="display: none;" x-transition.opacity.duration.200ms class="absolute flex items-center justify-center gap-1">
											<button type="button" @click="removeItem('periods', index)" class="text-green-500 hover:bg-green-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
											</button>
											<button type="button" @click="periodo.confirmando = false" class="text-red-500 hover:bg-red-50 active:scale-90 transition-all p-1.5 rounded-md border-none bg-transparent cursor-pointer">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
											</button>
										</div>
									</div>
								</div>

								<div class="mt-2 text-xs text-slate-500">
									<span class="font-medium">Regla:</span>
									<span x-text="periodo.unit"></span>
									<span x-text="periodo.min_value || 1"></span>
									<span>hasta</span>
									<span x-text="periodo.max_value || 'sin límite'"></span>
									<span class="ml-2 text-slate-400">ID: <span x-text="periodo.id"></span></span>
								</div>
							</div>
						</template>
					</div>

					<div class="mt-4">
						<button type="button" @click="addItem('periods')" class="text-sm font-medium bg-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white active:bg-blue-700 text-blue-600 py-2.5 px-5 rounded-lg border border-blue-200 hover:border-transparent active:scale-95 shadow-sm transition-all flex items-center gap-2 cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 group">
							<svg class="w-4 h-4 text-blue-600 group-hover:text-white group-focus:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
							Añadir Regla de Periodo
						</button>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 xl:col-span-2 flex flex-col">
					<div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
						<h2 class="text-lg font-semibold text-slate-800 m-0">Matriz de Precios Base (Combinaciones)</h2>
					</div>
					<div class="overflow-x-auto flex-grow">
						<table class="w-full text-sm text-left border-collapse">
							<thead class="text-slate-500 border-b border-slate-200">
								<tr>
									<th class="py-3 pr-4 font-medium w-1/5">Procesador</th>
									<th class="px-2 py-3 font-medium w-1/5">Gama</th>
									<template x-for="periodo in formData.periods" :key="'head-' + periodo.id">
										<th class="px-2 py-3 font-medium text-center min-w-[180px]">
											<div class="leading-tight">
												<div x-text="periodo.front_label || periodo.label"></div>
												<span class="text-xs font-normal text-slate-400" x-text="periodRangeText(periodo)"></span>
											</div>
										</th>
									</template>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								<template x-for="proc in formData.processors" :key="'proc-' + proc.id">
									<template x-for="gama in formData.gamas" :key="'row-' + proc.id + '-' + gama.id">
										<tr class="group hover:bg-slate-50 transition-colors">
											<td class="py-3 pr-4 font-medium text-slate-700" x-text="proc.label"></td>
											<td class="px-2 py-3 font-medium text-slate-700" x-text="gama.label"></td>

											<template x-for="periodo in formData.periods" :key="'cell-' + proc.id + '-' + gama.id + '-' + periodo.id">
												<td class="px-2 py-3">
													<div class="relative flex items-center">
														<span class="absolute left-3 text-slate-400 text-sm font-medium pointer-events-none" x-text="simboloDivisa"></span>
														<input type="number" step="0.01"
															:value="getPrice(proc.id, gama.id, periodo.id)"
															@input="setPrice(proc.id, gama.id, periodo.id, $event.target.value)"
															@keydown="['e', 'E', '+', '-'].includes($event.key) && $event.preventDefault()"
															class="w-full border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 p-2.5 pl-9 text-sm shadow-sm outline-none text-center"
															placeholder="0.00">
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

			defaults() {
				return {
					texts: {
						step1_eyebrow: 'PASO 1 DE 4',
						step1_title: '¿Qué aplicaciones vas a utilizar?',
						step1_subtitle: 'Elige la potencia que mejor se adapta a tus tareas habituales.',
						step2_eyebrow: 'PASO 2 DE 4',
						step2_title: '¿Qué tan pesada será la jornada para tu laptop?',
						step2_subtitle: 'El chasis determina la durabilidad, ventilación y portabilidad del equipo.',
						step3_eyebrow: 'PASO 3 DE 4',
						step3_title: 'Elige el tiempo de alquiler',
						step3_subtitle: 'Selecciona unidad y cantidad; calculamos el periodo exacto automáticamente.',
						step4_eyebrow: 'PASO 4 DE 4',
						step4_title: 'Tu cotización está lista',
						step4_subtitle: 'Revisa el resumen antes de solicitar contacto.',
						btn_next: 'Continuar →',
						btn_back: '← Volver',
						btn_finish: 'Ver mi solución',
						btn_restart: 'Cambiar selección',
						btn_request: 'Quiero hablar con un especialista ahora →',
						price_label: 'CUOTA MENSUAL / LAPTOP',
						quantity_label: 'Cantidad de laptops',
						period_label: 'Duración del alquiler',
						whatsapp_label: 'Quiero hablar con un especialista ahora',
						whatsapp_desc: 'Si prefieres, te atendemos por WhatsApp y armamos la cotización contigo.',
						whatsapp_url: 'https://wa.me/',
						manual_link: '¿Ya conoces lo que quieres? Configúralo manualmente',
						manual_title: 'Configuración rápida',
						manual_apply: 'Aplicar e ir al resumen'
					},
					processors: [
						{ id: 'i5', label: 'Core i5', front_label: 'Aplicaciones estándar', description: 'Uso principalmente Office, correos, videollamadas y navegación fluida.' },
						{ id: 'i7', label: 'Core i7', front_label: 'Software de alto rendimiento', description: 'Para programación, análisis masivo de datos o procesos que requieren respuesta inmediata.' }
					],
					gamas: [
						{ id: 'baja', label: 'Gama baja', front_label: 'Funcionalidad al mejor precio', description: 'Ideal para puestos administrativos en lugares fijos que buscan optimizar la inversión.' },
						{ id: 'media', label: 'Gama media', front_label: 'Productividad constante para oficina', description: 'Diseñada para jornadas intensas que necesitan una laptop que no se caliente ni se ralentice.' },
						{ id: 'alta', label: 'Gama alta', front_label: 'Trabajo de campo y condiciones exigentes', description: 'Equipos con protección reforzada para ambientes demandantes y uso intensivo.' }
					],
					periods: [
						{ id: 'semana_1', label: '1 semana', front_label: '1 semana', description: 'Periodo corto para proyectos puntuales.', unit: 'semanas', min_value: 1, max_value: 1 },
						{ id: 'semanas_2_4', label: '2 a 4 semanas', front_label: '2 a 4 semanas', description: 'Plan temporal extendido por semanas.', unit: 'semanas', min_value: 2, max_value: 4 },
						{ id: 'meses_1_12', label: '1 a 12 meses', front_label: '1 a 12 meses', description: 'Plan mensual para contratos estables.', unit: 'meses', min_value: 1, max_value: 12 }
					]
				};
			},

			init() {
				const incoming = this.initialSettings && typeof this.initialSettings === 'object' ? this.initialSettings : {};
				const defaults = this.defaults();
				this.formData.currency_code = incoming.currency_code || 'PEN';
				this.formData.texts = Object.assign({}, defaults.texts, incoming.texts || {});
				this.formData.processors = this.normalizeItems(incoming.processors, defaults.processors, 'proc');
				this.formData.gamas = this.normalizeItems(incoming.gamas, defaults.gamas, 'gama');
				this.formData.periods = this.normalizePeriods(incoming.periods, defaults.periods);
				this.formData.prices = incoming.prices && typeof incoming.prices === 'object' ? incoming.prices : {};
				this.actualizarSimbolo();
				this.normalizePrices();
			},

			normalizeItems(rawItems, fallback, prefix) {
				const source = Array.isArray(rawItems) && rawItems.length ? rawItems : fallback;
				const used = {};
				const output = [];

				source.forEach((item, index) => {
					const label = String(item && item.label ? item.label : '').trim();
					if (!label) return;
					let id = this.cleanId(item && item.id ? item.id : '');
					if (!id) id = prefix + '_' + (index + 1);
					while (used[id]) id = id + '_2';
					used[id] = true;

					output.push({
						id: id,
						label: label,
						front_label: String(item && item.front_label ? item.front_label : label).trim(),
						description: String(item && item.description ? item.description : '').trim(),
						confirmando: false
					});
				});

				if (!output.length) {
					return this.normalizeItems(fallback, fallback, prefix);
				}
				return output;
			},

			normalizePeriods(rawItems, fallback) {
				const source = Array.isArray(rawItems) && rawItems.length ? rawItems : fallback;
				const used = {};
				const output = [];
				const units = new Set(['dias', 'semanas', 'meses']);

				source.forEach((item, index) => {
					const label = String(item && item.label ? item.label : '').trim();
					if (!label) return;
					let id = this.cleanId(item && item.id ? item.id : '');
					if (!id) id = 'periodo_' + (index + 1);
					while (used[id]) id = id + '_2';
					used[id] = true;

					const unit = units.has(String(item && item.unit ? item.unit : 'meses').trim()) ? String(item.unit).trim() : 'meses';
					const minValue = Math.max(1, parseInt(item && item.min_value ? item.min_value : 1, 10) || 1);
					let maxValue = '';
					if (item && item.max_value !== '' && item.max_value !== null && typeof item.max_value !== 'undefined') {
						maxValue = Math.max(minValue, parseInt(item.max_value, 10) || minValue);
					}

					output.push({
						id: id,
						label: label,
						front_label: String(item && item.front_label ? item.front_label : label).trim(),
						description: String(item && item.description ? item.description : '').trim(),
						unit: unit,
						min_value: minValue,
						max_value: maxValue,
						confirmando: false
					});
				});

				if (!output.length) {
					return this.normalizePeriods(fallback, fallback);
				}
				return output;
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

			actualizarSimbolo() {
				const map = { PEN: 'S/.', USD: '$', COP: '$' };
				this.simboloDivisa = map[this.formData.currency_code] || 'S/.';
				this.formData.currency_symbol = this.simboloDivisa;
			},

			addItem(type) {
				const list = this.formData[type];
				if (!Array.isArray(list)) return;
				let n = list.length + 1;
				let id = this.cleanId(type + '_' + n);
				const ids = new Set(list.map((i) => i.id));
				while (ids.has(id)) {
					n += 1;
					id = this.cleanId(type + '_' + n);
				}

				if (type === 'periods') {
					list.push({
						id: id,
						label: '',
						front_label: '',
						description: '',
						unit: 'meses',
						min_value: 1,
						max_value: '',
						confirmando: false
					});
				} else {
					list.push({
						id: id,
						label: '',
						front_label: '',
						description: '',
						confirmando: false
					});
				}
				this.normalizePrices();
			},

			removeItem(type, index) {
				const list = this.formData[type];
				if (!Array.isArray(list) || list.length <= 1) return;
				list.splice(index, 1);
				this.normalizePrices();
			},

			periodRangeText(periodo) {
				const min = parseInt(periodo.min_value || 1, 10);
				const parsedMax = parseInt(periodo.max_value, 10);
				const max = periodo.max_value === '' || isNaN(parsedMax) ? 'sin límite' : parsedMax;
				return (periodo.unit || 'meses') + ' • ' + min + ' a ' + max;
			},

			getPrice(processorId, gamaId, periodId) {
				if (!this.formData.prices[processorId] || !this.formData.prices[processorId][gamaId]) return '';
				return this.formData.prices[processorId][gamaId][periodId] || '';
			},

			setPrice(processorId, gamaId, periodId, value) {
				const clean = this.limitDecimals(value);
				if (!this.formData.prices[processorId]) this.formData.prices[processorId] = {};
				if (!this.formData.prices[processorId][gamaId]) this.formData.prices[processorId][gamaId] = {};
				this.formData.prices[processorId][gamaId][periodId] = clean;
			},

			limitDecimals(value) {
				if (value === null || typeof value === 'undefined') return '';
				const text = String(value).replace(',', '.');
				const match = text.match(/^\d+(?:\.\d{0,2})?/);
				return match ? match[0] : '';
			},

			normalizePrices() {
				const normalized = {};
				this.formData.processors.forEach((proc) => {
					normalized[proc.id] = {};
					this.formData.gamas.forEach((gama) => {
						normalized[proc.id][gama.id] = {};
						this.formData.periods.forEach((periodo) => {
							normalized[proc.id][gama.id][periodo.id] = this.getPrice(proc.id, gama.id, periodo.id);
						});
					});
				});
				this.formData.prices = normalized;
			},

			beforeSubmit() {
				this.actualizarSimbolo();
				this.normalizePrices();
				const payload = JSON.parse(JSON.stringify(this.formData));
				['processors', 'gamas', 'periods'].forEach((type) => {
					payload[type] = payload[type].map((item) => {
						delete item.confirmando;
						return item;
					});
				});
				this.$refs.settingsJson.value = JSON.stringify(payload);
			}
		}));
	});
</script>
