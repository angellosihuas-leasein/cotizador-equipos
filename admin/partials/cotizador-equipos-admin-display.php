<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
$settings_json = wp_json_encode( $settings );
if ( ! $settings_json ) { $settings_json = '{}'; }
?>

<div class="cotizador-admin-wrap p-6 text-slate-800 font-sans" x-data="cotizadorUI()" x-init="init()">
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" @submit="beforeSubmit">
		<input type="hidden" name="action" value="ce_save_settings">
		<?php wp_nonce_field( 'ce_save_settings', 'ce_nonce' ); ?>
		<input type="hidden" name="ce_settings_json" x-ref="settingsJson">

		<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
			<div>
				<h1 class="text-2xl font-semibold text-slate-900 m-0">Reglas y Precios del Cotizador</h1>
				<p class="text-sm text-slate-500 mt-1 m-0">Configura los pasos, opciones y reglas de cálculo de tu cotizador.</p>
			</div>
			<div class="flex flex-col sm:flex-row items-stretch gap-4">
				<div class="flex items-center gap-2 bg-slate-50 px-4 rounded-lg border border-slate-200 h-[44px]">
					<span class="text-sm text-slate-600 font-medium">Moneda:</span>
					<select x-model="formData.currency_code" @change="actualizarSimbolo()" class="bg-transparent border-none text-sm font-semibold text-orange-600 focus:ring-0 cursor-pointer outline-none w-full h-full">
						<option value="PEN">Soles (S/.)</option>
						<option value="USD">Dólares ($)</option>
						<option value="COP">Pesos Col. ($)</option>
					</select>
				</div>
				<button type="submit" class="h-[44px] bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-medium px-6 rounded-lg shadow-sm transition-all border-none cursor-pointer">
					Guardar Cambios
				</button>
			</div>
		</div>

		<?php if ( isset( $_GET['settings-updated'] ) ) : ?>
			<div class="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">Cambios guardados correctamente.</div>
		<?php endif; ?>

		<div class="mb-6 bg-white border border-slate-200 rounded-xl p-2 inline-flex gap-2">
			<button type="button" @click="tab = 'textos'" class="px-4 py-2 text-sm font-medium rounded-lg transition-all border-none cursor-pointer" :class="tab === 'textos' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 bg-transparent'">Textos del Front</button>
			<button type="button" @click="tab = 'configuracion'" class="px-4 py-2 text-sm font-medium rounded-lg transition-all border-none cursor-pointer" :class="tab === 'configuracion' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 bg-transparent'">Opciones y Precios</button>
		</div>

		<div x-show="tab === 'textos'" style="display: none;">
			<div class="grid grid-cols-1 xl:grid-cols-2 gap-6 pr-2">
				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Textos Generales</h2>
					<div class="space-y-3">
						<label class="block text-xs font-semibold text-slate-500">Botón WhatsApp (Arriba)</label>
						<input type="text" x-model="formData.texts.whatsapp_label" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500">
						<input type="text" x-model="formData.texts.whatsapp_desc" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500" placeholder="Subtítulo whatsapp">
						<input type="text" x-model="formData.texts.whatsapp_url" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500" placeholder="Enlace wa.me/...">
					</div>
				</div>
				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Textos Paso 1 y 2</h2>
					<div class="space-y-3">
						<input type="text" x-model="formData.texts.step1_title" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500" placeholder="Título Paso 1">
						<input type="text" x-model="formData.texts.step2_title" class="w-full font-medium border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-orange-500" placeholder="Título Paso 2">
					</div>
				</div>
			</div>
		</div>

		<div x-show="tab === 'configuracion'" style="display: none;">
			<div class="grid grid-cols-1 gap-6">
				<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
					<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
						<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Opciones: Paso 1 (Procesador)</h2>
						<div class="space-y-3">
							<template x-for="(proc, index) in formData.processors" :key="proc.id">
								<div class="p-4 border border-slate-200 rounded-lg bg-slate-50">
									<input type="text" x-model="proc.label" class="w-full font-medium border border-slate-200 rounded p-2 text-sm outline-none mb-2" placeholder="Título Principal">
									<textarea x-model="proc.description" class="w-full border border-slate-200 rounded p-2 text-sm outline-none text-slate-500 mb-2" rows="2" placeholder="Descripción"></textarea>
									<div class="flex justify-end"><button type="button" @click="removeItem('processors', index)" class="text-xs text-red-500 font-semibold cursor-pointer border-none bg-transparent hover:underline">Eliminar</button></div>
								</div>
							</template>
						</div>
						<button type="button" @click="addItem('processors')" class="mt-4 text-sm font-medium text-orange-600 bg-white border border-orange-200 py-2 px-4 rounded-lg cursor-pointer hover:bg-orange-50">+ Añadir Opción</button>
					</div>

					<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
						<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-5 text-slate-800 m-0">Opciones: Paso 2 (Jornada)</h2>
						<div class="space-y-3">
							<template x-for="(gama, index) in formData.gamas" :key="gama.id">
								<div class="p-4 border border-slate-200 rounded-lg bg-slate-50">
									<input type="text" x-model="gama.label" class="w-full font-medium border border-slate-200 rounded p-2 text-sm outline-none mb-2" placeholder="Título Principal">
									<textarea x-model="gama.description" class="w-full border border-slate-200 rounded p-2 text-sm outline-none text-slate-500 mb-2" rows="2" placeholder="Descripción"></textarea>
									<div class="flex justify-end"><button type="button" @click="removeItem('gamas', index)" class="text-xs text-red-500 font-semibold cursor-pointer border-none bg-transparent hover:underline">Eliminar</button></div>
								</div>
							</template>
						</div>
						<button type="button" @click="addItem('gamas')" class="mt-4 text-sm font-medium text-orange-600 bg-white border border-orange-200 py-2 px-4 rounded-lg cursor-pointer hover:bg-orange-50">+ Añadir Opción</button>
					</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-4 text-slate-800 m-0">Reglas de Periodos de Alquiler</h2>
					<p class="text-sm text-slate-500 mb-4">Define los rangos de tiempo. El cotizador evaluará lo que elija el usuario y aplicará la regla correspondiente.</p>

					<div class="overflow-x-auto border border-slate-200 rounded-lg">
						<table class="w-full text-sm text-left border-collapse bg-white">
							<thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
								<tr>
									<th class="py-3 px-4 font-semibold">Unidad</th>
									<th class="py-3 px-4 font-semibold">Mínimo</th>
									<th class="py-3 px-4 font-semibold">Máximo</th>
									<th class="py-3 px-4 font-semibold">ID / Etiqueta (Interno)</th>
									<th class="py-3 px-4 font-semibold text-center">Acción</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								<template x-for="(periodo, index) in formData.periods" :key="periodo.id">
									<tr class="hover:bg-slate-50">
										<td class="py-3 px-4">
											<select x-model="periodo.unit" class="w-full border border-slate-300 rounded p-1.5 outline-none focus:border-orange-500">
												<option value="semanas">Semanas</option>
												<option value="meses">Meses</option>
											</select>
										</td>
										<td class="py-3 px-4">
											<input type="number" min="1" x-model="periodo.min_value" class="w-20 border border-slate-300 rounded p-1.5 outline-none focus:border-orange-500 text-center">
										</td>
										<td class="py-3 px-4">
											<input type="number" min="1" x-model="periodo.max_value" class="w-20 border border-slate-300 rounded p-1.5 outline-none focus:border-orange-500 text-center" placeholder="∞">
										</td>
										<td class="py-3 px-4">
											<input type="text" x-model="periodo.label" class="w-full border border-slate-300 rounded p-1.5 outline-none focus:border-orange-500" placeholder="Ej: 1 a 3 meses">
										</td>
										<td class="py-3 px-4 text-center">
											<button type="button" @click="removeItem('periods', index)" class="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer p-1">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
											</button>
										</td>
									</tr>
								</template>
							</tbody>
						</table>
					</div>
					<button type="button" @click="addItem('periods')" class="mt-4 text-sm font-medium text-orange-600 bg-white border border-orange-200 py-2 px-4 rounded-lg cursor-pointer hover:bg-orange-50">+ Añadir Regla</button>
				</div>

				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
					<h2 class="text-lg font-semibold border-b border-slate-100 pb-3 mb-4 text-slate-800 m-0">Matriz de Precios Unitarios (por equipo)</h2>
					<div class="overflow-x-auto border border-slate-200 rounded-lg">
						<table class="w-full text-sm text-left border-collapse bg-white">
							<thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
								<tr>
									<th class="py-3 px-4 font-semibold w-1/4">Procesador</th>
									<th class="py-3 px-4 font-semibold w-1/4">Jornada</th>
									<template x-for="periodo in formData.periods" :key="'head-' + periodo.id">
										<th class="py-3 px-4 font-semibold text-center min-w-[140px]">
											<div class="text-orange-600" x-text="periodo.label || 'Regla'"></div>
											<div class="text-[11px] font-normal text-slate-400 mt-1" x-text="periodo.unit + ' (' + periodo.min_value + '-' + (periodo.max_value || '∞') + ')'"></div>
										</th>
									</template>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								<template x-for="proc in formData.processors" :key="'proc-' + proc.id">
									<template x-for="gama in formData.gamas" :key="'row-' + proc.id + '-' + gama.id">
										<tr class="hover:bg-orange-50/20">
											<td class="py-3 px-4 font-medium text-slate-700" x-text="proc.label"></td>
											<td class="py-3 px-4 font-medium text-slate-700" x-text="gama.label"></td>
											<template x-for="periodo in formData.periods" :key="'cell-' + proc.id + '-' + gama.id + '-' + periodo.id">
												<td class="py-3 px-4">
													<div class="relative flex items-center">
														<span class="absolute left-3 text-slate-400 text-sm font-medium" x-text="simboloDivisa"></span>
														<input type="number" step="0.01" :value="getPrice(proc.id, gama.id, periodo.id)" @input="setPrice(proc.id, gama.id, periodo.id, $event.target.value)" class="w-full border border-slate-300 rounded p-2 pl-9 text-sm outline-none focus:border-orange-500 text-center font-bold" placeholder="0.00">
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
				this.formData.processors = this.normalizeItems(incoming.processors, 'proc');
				this.formData.gamas = this.normalizeItems(incoming.gamas, 'gama');
				this.formData.periods = this.normalizePeriods(incoming.periods);
				this.formData.prices = incoming.prices || {};
				this.actualizarSimbolo();
				this.normalizePrices();
			},

			normalizeItems(rawItems, prefix) {
				const source = Array.isArray(rawItems) ? rawItems : [];
				return source.map((item, idx) => ({
					id: item.id || prefix + '_' + (idx + 1),
					label: item.label || '',
					front_label: item.front_label || item.label || '',
					description: item.description || ''
				}));
			},

			normalizePeriods(rawItems) {
				const source = Array.isArray(rawItems) ? rawItems : [];
				return source.map((item, idx) => ({
					id: item.id || 'periodo_' + (idx + 1),
					label: item.label || '',
					unit: ['semanas', 'meses'].includes(item.unit) ? item.unit : 'meses',
					min_value: Math.max(1, parseInt(item.min_value) || 1),
					max_value: item.max_value === '' ? '' : Math.max(1, parseInt(item.max_value) || 1)
				}));
			},

			actualizarSimbolo() {
				const map = { PEN: 'S/.', USD: '$', COP: '$' };
				this.simboloDivisa = map[this.formData.currency_code] || 'S/.';
				this.formData.currency_symbol = this.simboloDivisa;
			},

			addItem(type) {
				const list = this.formData[type];
				let id = type + '_' + Date.now();
				if (type === 'periods') {
					list.push({ id: id, label: '', unit: 'meses', min_value: 1, max_value: '' });
				} else {
					list.push({ id: id, label: '', description: '' });
				}
				this.normalizePrices();
			},

			removeItem(type, index) {
				this.formData[type].splice(index, 1);
				this.normalizePrices();
			},

			getPrice(p, g, per) {
				return this.formData.prices[p]?.[g]?.[per] || '';
			},

			setPrice(p, g, per, value) {
				if (!this.formData.prices[p]) this.formData.prices[p] = {};
				if (!this.formData.prices[p][g]) this.formData.prices[p][g] = {};
				this.formData.prices[p][g][per] = value.replace(/[^0-9.]/g, '');
			},

			normalizePrices() {
				const normalized = {};
				this.formData.processors.forEach(proc => {
					normalized[proc.id] = {};
					this.formData.gamas.forEach(gama => {
						normalized[proc.id][gama.id] = {};
						this.formData.periods.forEach(per => {
							normalized[proc.id][gama.id][per.id] = this.getPrice(proc.id, gama.id, per.id);
						});
					});
				});
				this.formData.prices = normalized;
			},

			beforeSubmit() {
				this.normalizePrices();
				this.$refs.settingsJson.value = JSON.stringify(this.formData);
			}
		}));
	});
</script>