window.CanvasRecorder = {
	countIndex: 0,
	cache: [],
	record: (canvas, obj = {}) => {
		const canvasEl = typeof canvas == "string" ? document.querySelector(canvas) : canvas;
		let recordedChunks = [];
		let event = {}
		
		return new Promise((res, rej) => {
			let stream = canvasEl.captureStream(Math.max(1, Math.min(60, obj.fps || 30)));
			mediaRecorder = new MediaRecorder(stream, {
				mimeType: "video/webm; codecs=vp9"
			});
			
			mediaRecorder.start(Math.max(1000, Math.min(60000, obj.duration || 4000)));
			
			event.start = obj && obj.event && typeof obj.event.start == "function" ? obj.event.start : () => {};
			event.start();
			
			mediaRecorder.ondataavailable = (event) => {
			recordedChunks.push(event.data);
				if (mediaRecorder.state === 'recording') {
					mediaRecorder.stop();
				}
				
			}
			
			mediaRecorder.onstop = (event) => {
				let blob = new Blob(recordedChunks, {type: "video/webm" });
				let url = URL.createObjectURL(blob) + "#Powered-by-CanvasRecorder";
				res(url);
				window.CanvasRecorder.cache.push({blob: url, data: recordedChunks, time: new Date(), canvas: canvasEl, saved: false, savedFile: "", index: window.CanvasRecorder.countIndex});
				window.CanvasRecorder.countIndex += 1;
				
				event.stop = obj && obj.event && typeof obj.event.stop == "function" ? obj.event.stop : () => {};
				event.stop();
			}
		})
	},
	cleanup: () => {
		for (let cache in window.CanvasRecorder.cache) {
			URL.revokeObjectURL(window.CanvasRecorder.cache[cache].blob);
		}
		window.CanvasRecorder.cache = [];
		window.CanvasRecorder.countIndex = 0;
	},
	save: (index) => {
		let twoDigit = (value) => {
			value = Math.floor(value);
			return value <= 9 ? "0" + value : value;
		}
		
		index = Math.max(0, index || window.CanvasRecorder.cache.length - 1);
		let cache = window.CanvasRecorder.cache[index];
		if (!cache) {
			console.error("[CanvasRecorder]", "Object not found");
			throw Error("Object not found");
		}
		if (cache.saved == true) {
			console.warn("[CanvasRecorder]", `${cache.savedFile} is already saved`);
			return;
		}
		else {
			cache.saved = true;
		}
		let saver = document.createElement("a");
		document.body.appendChild(saver);
		saver.href = cache.blob;
		saver.download = `CanvasRecorder.${cache.time.getFullYear()}-${twoDigit(cache.time.getMonth() + 1)}-${twoDigit(cache.time.getDate())}.${twoDigit(cache.time.getHours())}-${twoDigit(cache.time.getMinutes())}-${twoDigit(cache.time.getSeconds())}-${cache.time.getTime()%1000}.webm`;
		console.log("[CanvasRecorder]", `Successful saved: ${saver.download}`);
		cache.savedFile = saver.download;
		saver.click();
		document.body.removeChild(saver);
	},
	getBlobs: (canvas) => {
		let arrayBlob = [];
		let canvasEl = typeof canvas
		for (let cache in window.CanvasRecorder.cache) {
			let arrayCache = window.CanvasRecorder.cache[cache];
			if (canvas == arrayCache.canvas) {
				arrayBlob.push(arrayCache.blob);
			}
		}
		return arrayBlob;
	},
	preview: (blob, params = {}, fromEl = null) => {
		let el = fromEl ? (typeof fromEl == "string" ? document.querySelector(fromEl) : fromEl) : document.body;
		
		if (/Powered-by-CanvasRecorder/i.test(blob)) {
			let video = document.createElement("video");
			
			video.autoplay = params.autoplay || true;
			video.controls = params.controls || false;
			video.loop = params.loop || true;
			video.style.width = params.width || "";
			video.style.height = params.height || "";
			video.setAttribute("class", params.class || "");
			video.setAttribute("style", params.style || "");
			
			video.muted = true;
			video.src = blob;
			el.appendChild(video);
		}
		else {
			console.error("[CanvasRecorder]", `Cannot preview video ${blob} for another src or not require "blob"`);
			throw Error(`Cannot preview video ${blob} for another src or not require "blob"`);
		}
	}
}
