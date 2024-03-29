const fpworker = (async () => {
	// Compute all scopes
	const ask = fn => { try { return fn() } catch (e) { return } }
	const getFingerprint = async () => {
		const getGPU = (canvas1, canvas2) => {
			const getRenderer = gl => gl.getParameter(
				gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL
			)
			const gpuSet = new Set([
				ask(() => getRenderer(canvas1.getContext('webgl'))),
				ask(() => getRenderer(canvas2.getContext('webgl2')))
			])
			gpuSet.delete() // discard undefined
			// find 1st trusted if size > 1
			// need to discard unknown gpus
			return [...gpuSet]
		}

		const getCanvasData = async ({ canvas, ctx, width = 186, height = 30 }) => {
			if (!canvas || !ctx) return
			const getData = async blob => {
				if (!blob) return
				const getRead = (method, blob) => new Promise(resolve => {
					const reader = new FileReader()
					reader[method](blob)
					return reader.addEventListener('loadend', () => resolve(reader.result))
				})
				const [
					canvasReadAsArrayBuffer, canvasReadAsBinaryString, canvasReadAsDataURL, canvasReadAsText
				] = await Promise.all([
					getRead('readAsArrayBuffer', blob),
					getRead('readAsBinaryString', blob),
					getRead('readAsDataURL', blob),
					getRead('readAsText', blob),
				])
				return {
					canvasReadAsArrayBuffer: String.fromCharCode.apply(null, new Uint8Array(canvasReadAsArrayBuffer)),
					canvasReadAsBinaryString,
					canvasReadAsDataURL,
					canvasReadAsText
				}
			}
			canvas.width = width
			canvas.height = height
			ctx.font = '14px Arial'
			ctx.fillText(`😃🙌🧠🦄🐉🌊🍧🏄‍♀️🌠🔮`, 0, 20)
			ctx.fillStyle = 'rgba(0, 0, 0, 0)'
			ctx.fillRect(0, 0, width-50, height)
			if (canvas.constructor.name === 'OffscreenCanvas') {
				return getData(await canvas.convertToBlob())
			}
			return new Promise(resolve => {
				return canvas.toBlob(async blob => resolve(getData(blob)))
			})
		}

		const getEmojis = ctx => {
			if (!ctx) return
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
			const emojiSumSet = new Set()
			const emojiSet = new Set()
			ask(() => emojis.forEach(emoji => {
				const sum = getSum(ctx.measureText(emoji))
				if (!emojiSumSet.has(sum)) {
					emojiSumSet.add(sum)
					return emojiSet.add(emoji)
				}
				return
			}))
			return {
				emojiUnique: [...emojiSet].join('')
			}
		}

		const getSystemFontLists = () => ({
			windowsFonts: {
				// https://docs.microsoft.com/en-us/typography/fonts/windows_11_font_list
				'7': [
					'Cambria Math',
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
			},
			appleFonts: ['Helvetica Neue'],
			linuxFonts: [
				'Arimo', // ubuntu, chrome os
				'Jomolhari', // chrome os
				'Ubuntu' // ubuntu
			],
			miscFonts: [
				'Dancing Script', // android
				'Droid Sans Mono', // android
				'Roboto' // android, chrome OS
			]
		})

		const detectFonts = ctx => {
			if (!ctx) return
			const { windowsFonts, appleFonts, linuxFonts, miscFonts } = getSystemFontLists()
			const fontList = [
				...Object.keys(windowsFonts).map(key => windowsFonts[key]).flat(),
				...appleFonts,
				...linuxFonts,
				...miscFonts
			]
			const getTextMetrics = (ctx, font) => {
				ctx.font = `256px ${font}`
				return ctx.measureText('mmmmmmmmmmlli')
			}
			const baseFonts = ['monospace', 'sans-serif', 'serif']
			const base = baseFonts.reduce((acc, font) => {
				acc[font] = getTextMetrics(ctx, font)
				return acc
			}, {})
			const families = fontList.reduce((acc, font) => {
				baseFonts.forEach(baseFont => acc.push(`'${font}', ${baseFont}`))
				return acc
			}, [])
			const detectedFonts = families.reduce((acc, family) => {
				const basefont = /, (.+)/.exec(family)[1]
				const dimensions = getTextMetrics(ctx, family)
				const font = /\'(.+)\'/.exec(family)[1]
				const detected = dimensions.width != base[basefont].width
				return !isNaN(dimensions.width) && detected ? acc.add(font) : acc
			}, new Set())
			return { fontsDetected: [...detectedFonts].sort() }
		}

		const getFonts = () => ask(() => {
			const { windowsFonts, appleFonts, linuxFonts, miscFonts } = getSystemFontLists()
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
			const fontsChecked = fontList.filter(font => fontFaceSet.check(`0 '${font}'`))
			return  { fontsChecked: fontsChecked.sort() }
		})

		const getFontSystem = ({ supportedFonts, windowsFonts, appleFonts, linuxFonts, miscFonts }) => {
			const getWindowsVersion = (windowsFonts, fonts) => {
				const fontVersion = {
					['11']: windowsFonts['11'].find(x => fonts.includes(x)),
					['10']: windowsFonts['10'].find(x => fonts.includes(x)),
					['8.1']: windowsFonts['8.1'].find(x => fonts.includes(x)),
					['8']: windowsFonts['8'].find(x => fonts.includes(x)),
					// require complete set of Windows 7 fonts
					['7']: windowsFonts['7'].filter(x => fonts.includes(x)).length == windowsFonts['7'].length
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
			const systemHashMap = {
				'Arimo,Jomolhari,Roboto': 'Chrome OS',
				'Arimo,Ubuntu': 'Ubuntu',
				'Dancing Script,Droid Sans Mono,Roboto': 'Android'
			}
			const hasAppleFonts = supportedFonts.find(x => appleFonts.includes(x))
			const hasLinuxFonts = supportedFonts.find(x => linuxFonts.includes(x))
			const windowsFontSystem = getWindowsVersion(windowsFonts, supportedFonts)
			const fontSystem = (
				windowsFontSystem || (
					hasLinuxFonts ? (systemHashMap[''+supportedFonts] || 'Linux') :
						hasAppleFonts ? 'Apple' :
							(systemHashMap[''+supportedFonts] || 'unknown')
				)
			)
			return fontSystem
		}

		const loadFonts = () => ask(async () => {
			if (!globalThis.FontFace) return
			const { windowsFonts, appleFonts, linuxFonts, miscFonts } = getSystemFontLists()
			const fontList = [
				...Object.keys(windowsFonts).map(key => windowsFonts[key]).flat(),
				...appleFonts,
				...linuxFonts,
				...miscFonts
			]
			const fontFaceList = fontList.map(font => new FontFace(font, `local("${font}")`))
			const responseCollection = await Promise.allSettled(fontFaceList.map(font => font.load()))
			const fontsLoaded = responseCollection.reduce((acc, font) => {
				return font.status == 'fulfilled' ? [...acc, font.value.family] : acc
			}, [])
			return {
				fontsLoaded: fontsLoaded.sort(),
				fontSystem: getFontSystem({
					supportedFonts: fontsLoaded,
					windowsFonts,
					appleFonts,
					linuxFonts,
					miscFonts
				})
			}
		})

		const getUserAgentData = () => {
			if (!navigator.userAgentData) return
			return navigator.userAgentData.getHighEntropyValues([
				'platform',
				'platformVersion',
				'architecture',
				'bitness',
				'model',
				'uaFullVersion'
			])
		}

		const canvas2d = (
			ask(() => new OffscreenCanvas(186, 30)) ||
			ask(() => document.createElement('canvas'))
		)
		const ctx2d = ask(() => canvas2d.getContext('2d'))
		const canvasGl = (
			ask(() => new OffscreenCanvas(30, 30)) ||
			ask(() => document.createElement('canvas'))
		)
		const canvasGl2 = (
			ask(() => new OffscreenCanvas(30, 30)) ||
			ask(() => document.createElement('canvas'))
		)

		const [
			canvasData,
			userAgentData,
			loadedFonts
		] = await Promise.all([
			getCanvasData({ canvas: canvas2d, ctx: ctx2d }),
			getUserAgentData(),
			loadFonts()
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

		const {
			architecture: uaArchitecture,
			model: uaModel,
			platform: uaPlatform,
			platformVersion: uaPlatformVersion,
			uaFullVersion
		} = userAgentData || {}

		return {
			// Blink
			...canvasData,
			...getEmojis(ctx2d),
			...getEmojis(),
			...getFonts(),
			...loadedFonts,
			...detectFonts(ctx2d),
			uaArchitecture,
			uaModel,
			uaPlatform,
			uaPlatformVersion,
			uaFullVersion,
			gpu: getGPU(canvasGl, canvasGl2),
			deviceMemory: navigator.deviceMemory,
			// Blink/Gecko
			hardwareConcurrency: navigator.hardwareConcurrency,
			// Blink/Gecko/WebKit
			timeZone: ask(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
			language: navigator.language,
			languages: ''+navigator.languages,
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

	const scriptSource = './fpworker.js'
	console.log(location.pathname)
	const start = performance.now()
	const [ windowScope, dedicatedWorker, sharedWorker, serviceWorker ] = await Promise.all([
		getFingerprint(),
		getDedicatedWorker({ scriptSource }),
		getSharedWorker({ scriptSource }),
		getServiceWorker({ scriptSource, scope: location.pathname })
	]).catch(error => console.error(error.message))

	const data = {
		perf: (performance.now() - start).toFixed(2),
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
