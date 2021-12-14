const fpworker = (async () => {
	// Compute all scopes
	const ask = fn => { try { return fn() } catch (e) { return } }
	const getFingerprint = async () => {
		const getGPU = () => {
			const getRenderer = gl => gl.getParameter(
				gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL
			)
			const gpuSet = new Set([
				ask(() => getRenderer(new OffscreenCanvas(0, 0).getContext('webgl'))),
				ask(() => getRenderer(new OffscreenCanvas(0, 0).getContext('webgl2'))),
				ask(() => getRenderer(document.createElement('canvas').getContext('webgl'))),
				ask(() => getRenderer(document.createElement('canvas').getContext('webgl2')))
			])
			gpuSet.delete() // discard undefined
			// find 1st trusted if size > 1
			// need to discard unknown gpus
			return [...gpuSet]
		}
		const getCanvas = async () => {
			const getData = async blob => {
				if (!blob) return
				const getRead = (method, blob) => new Promise(resolve => {
					const reader = new FileReader()
					reader[method](blob)
					return reader.addEventListener('loadend', () => resolve(reader.result))
				})
				const [
					readAsArrayBuffer, readAsDataURL, readAsBinaryString, readAsText
				] = await Promise.all([
					getRead('readAsArrayBuffer', blob),
					getRead('readAsDataURL', blob),
					getRead('readAsBinaryString', blob),
					getRead('readAsText', blob),
				])
				return {
					readAsArrayBuffer: String.fromCharCode.apply(null, new Uint8Array(readAsArrayBuffer)),
					readAsBinaryString,
					readAsDataURL,
					readAsText
				}
			}
			const width = 136, height = 30
			const canvas = (
				ask(() => new OffscreenCanvas(width, height)) ||
				ask(() => document.createElement('canvas'))
			)
			if (!canvas) return
			const ctx = ask(() => canvas.getContext('2d'))
			if (!ctx) return
			canvas.width  = 186
			canvas.height = 30
			ctx.font = '14px Arial'
			ctx.fillText(`😃🙌🧠🦄🐉🌊🍧🏄‍♀️🌠🔮`, 0, 20)
			ctx.fillStyle = 'rgba(0, 0, 0, 0)'
			ctx.fillRect(0, 0, width, height)

			if (canvas.constructor.name === 'OffscreenCanvas') {
				return getData(await canvas.convertToBlob())
			}
			return new Promise(resolve => {
				return canvas.toBlob(async blob => resolve(getData(blob)))
			})
		}

		const getUserAgentData = () => {
			if (!('userAgentData' in navigator) || !navigator.userAgentData) {
				return
			}
			return navigator.userAgentData.getHighEntropyValues([
				'platform',
				'platformVersion',
				'architecture',
				'bitness',
				'model',
				'uaFullVersion'
			])
		}
	
		const getFonts = () => ask(() => {
			const windowsFonts = {
				// https://docs.microsoft.com/en-us/typography/fonts/windows_11_font_list
				'7': [
					'Cambria Math',
					'Consolas',
					'Lucida Console'
				],
				'8': [
					'Aldhabi',
					'Gadugi',
					'Myanmar Text',
					'Nirmala UI'
				],
				'8.1': [
					'Leelawadee UI',
					'Javanese Text',
					'Segoe UI Emoji'
				],
				'10': [
					'HoloLens MDL2 Assets', // 10 (v1507) +
					'Segoe MDL2 Assets', // 10 (v1507) +
					'Bahnschrift', // 10 (v1709) +-
					'Ink Free', // 10 (v1803) +-
				],
				'11': ['Segoe Fluent Icons']
			}
			const appleFonts = ['Helvetica Neue']
			const linuxFonts = [
				'Arimo', // ubuntu, chrome os
				'Jomolhari', // chrome os
				'Ubuntu' // ubuntu
			]
			const miscFonts = [
				'Roboto', // chrome OS
				'Monaco', // android + mac
				'Baskerville' // android + mac
			]
			const fontList = [
				...Object.keys(windowsFonts).map(key => windowsFonts[key]).flat(),
				...appleFonts,
				...linuxFonts,
				...miscFonts
			]

			const fontFaceSet = globalThis.document ? document.fonts : fonts
			const getRandomValues = n => [...crypto.getRandomValues(new Uint32Array(n))]
				.map(n => n.toString(36)).join('')
			if (fontFaceSet.check(`0 '${getRandomValues(1)}'`)) return
			fontFaceSet.clear()
			const supported = fontList.filter(font => fontFaceSet.check(`0 '${font}'`))

			const getWindowsVersion = (windowsFonts, supported) => {
				const fontVersion = {
					['11']: windowsFonts['11'].find(x => supported.includes(x)),
					['10']: windowsFonts['10'].find(x => supported.includes(x)),
					['8.1']: windowsFonts['8.1'].find(x => supported.includes(x)),
					['8']: windowsFonts['8'].find(x => supported.includes(x)),
					['7']: windowsFonts['7'].find(x => supported.includes(x))
				}
				const hash = (
					''+Object.keys(fontVersion).sort().filter(key => !!fontVersion[key])
				)
				const hashMap = {
					'10,11,7,8,8.1': '11',
					'10,7,8,8.1': '10',
					'7,8,8.1': '8.1',
					'11,7,8,8.1': '8.1', // missing 10
					'7,8': '8',
					'10,7,8': '8', // missing 8.1
					'10,11,7,8': '8', // missing 8.1
					'7': '7',
					'7,8.1': '7',
					'10,7,8.1': '7', // missing 8
					'10,11,7,8.1': '7', // missing 8
				}
				const version = hashMap[hash]
				return version ? `Windows ${version}` : undefined
			}
			const hasAppleFonts = supported.find(x => appleFonts.includes(x))
			const hasLinuxFonts = supported.find(x => linuxFonts.includes(x))
			const windowsFontSystem = getWindowsVersion(windowsFonts, supported)
			const system = (
				windowsFontSystem || (
					hasLinuxFonts	? 'Linux' :
						hasAppleFonts ? 'Apple' :
							'unknown'
				)
			)
			return  { supported, system }
		})

		const getEmojis = () => {
			const emojis = [
				[128512],[9786],[129333, 8205, 9794, 65039],[9832],[9784],[9895],[8265],[8505],[127987, 65039, 8205, 9895, 65039],[129394],[9785],[9760],[129489, 8205, 129456],[129487, 8205, 9794, 65039],[9975],[129489, 8205, 129309, 8205, 129489],[9752],[9968],[9961],[9972],[9992],[9201],[9928],[9730],[9969],[9731],[9732],[9976],[9823],[9937],[9000],[9993],[9999],[10002],[9986],[9935],[9874],[9876],[9881],[9939],[9879],[9904],[9905],[9888],[9762],[9763],[11014],[8599],[10145],[11013],[9883],[10017],[10013],[9766],[9654],[9197],[9199],[9167],[9792],[9794],[10006],[12336],[9877],[9884],[10004],[10035],[10055],[9724],[9642],[10083],[10084],[9996],[9757],[9997],[10052],[9878],[8618],[9775],[9770],[9774],[9745],[10036],[127344],[127359]
			].map(emojiCode => String.fromCodePoint(...emojiCode))
			const getSum = textMetrics => (
				+(textMetrics.actualBoundingBoxAscent||0)
				+(textMetrics.actualBoundingBoxDescent||0)
				+(textMetrics.actualBoundingBoxLeft||0)
				+(textMetrics.actualBoundingBoxRight||0)
				+(textMetrics.fontBoundingBoxAscent||0)
				+(textMetrics.fontBoundingBoxDescent||0)
				+(textMetrics.width||0)
			)
			const ctx = (
				ask(() => new OffscreenCanvas(0, 0).getContext('2d')) ||
				ask(() => document.createElement('canvas').getContext('2d'))
			)
			if (!ctx) return
			const emojiSums = new Set()
			const emojiSet = new Set()
			ask(() => emojis.forEach(emoji => {
				const sum = getSum(ctx.measureText(emoji))
				if (!emojiSums.has(sum)) {
					emojiSums.add(sum)
					return emojiSet.add(emoji)
				}
				return
			}))
			const metricSum = [...emojiSums].reduce((acc, n) => acc += n, 0)
			return { unique: [...emojiSet], metricSum }
		}

		const [
			canvas,
			userAgentData
		] = await Promise.all([
			getCanvas(),
			getUserAgentData()
		]).catch(error => console.error(error))

		const getEngine = () => {
			const hashMap = {
				'1.9275814160560204e-50': 'Blink',
				'1.9275814160560185e-50': 'Gecko',
				'1.9275814160560206e-50': 'WebKit'
			}
			const mathPI = 3.141592653589793
			return hashMap[mathPI ** -100] || 'unknown'
		}
		
		return {
			// Blink
			canvas,
			emojis: getEmojis(),
			fonts: getFonts(),
			gpu: getGPU(),
			userAgentData,
			deviceMemory: navigator.deviceMemory,
			// Blink/Gecko
			hardwareConcurrency: navigator.hardwareConcurrency,
			// Blink/Gecko/WebKit
			timeZone: ask(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
			language: navigator.language,
			languages: navigator.languages,
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			engine: getEngine()
		}
	}

	// Compute and communicate from worker scopes
	const onEvent = (eventType, fn) => addEventListener(eventType, fn)
	const send = async source => source.postMessage(await getFingerprint())
	if (!globalThis.document && globalThis.WorkerGlobalScope) return (
		globalThis.ServiceWorkerGlobalScope ? onEvent('message', async e => send(e.source)) :
		globalThis.SharedWorkerGlobalScope ? onEvent('connect', async e => send(e.ports[0])) :
		await send(self) // DedicatedWorkerGlobalScope
	)

	// Compute and communicate from window scope
	const resolveWorkerData = (target, resolve, fn) => target.addEventListener('message', event => {
		fn(); return resolve(event.data)
	})
	const getDedicatedWorker = ({ scriptSource }) => new Promise(resolve => {
		const dedicatedWorker = ask(() => new Worker(scriptSource))
		if (!dedicatedWorker) return resolve()
		return resolveWorkerData(dedicatedWorker, resolve, () => dedicatedWorker.terminate())
	})

	const getSharedWorker = ({ scriptSource }) => new Promise(resolve => {
		const sharedWorker = ask(() => new SharedWorker(scriptSource))
		if (!sharedWorker) return resolve()
		sharedWorker.port.start()
		return resolveWorkerData(sharedWorker.port, resolve, () => sharedWorker.port.close())
	})

	const getServiceWorker = ({ scriptSource, scope }) => new Promise(async resolve => {
		const registration = await ask(() => navigator.serviceWorker.register(scriptSource, { scope }).catch(e => {}))
		if (!registration) return resolve()
		return navigator.serviceWorker.ready.then(registration => {
			registration.active.postMessage(undefined)
			return resolveWorkerData(navigator.serviceWorker, resolve, () => registration.unregister())
		})
	})

	const scriptSource = document.currentScript.src // '/fpworker.js'
	const start = performance.now()
	const [ windowScope, dedicatedWorker, sharedWorker, serviceWorker ] = await Promise.all([
		getFingerprint(),
		getDedicatedWorker({ scriptSource }),
		getSharedWorker({ scriptSource }),
		getServiceWorker({ scriptSource, scope: '/' })
	]).catch(error => console.error(error.message))

	console.log((performance.now() - start).toFixed(2))
	const data = {
		windowScope,
		dedicatedWorker,
		sharedWorker,
		serviceWorker
	}
	return data
})()


/*
await new FontFace('ZWAdobeF', `local("ZWAdobeF")`).load().catch(e => {})

engine version estimate
textMetrics fonts
  
matchmedia
timezone

more textMetrics
more fonts
canvas pixels?
permissions
*/