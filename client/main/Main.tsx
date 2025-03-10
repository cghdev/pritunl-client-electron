import process from "process"
import path from "path"
import fs from "fs"
import electron from "electron"
import * as Service from "./Service"
import Config from "./Config"

let tray: electron.Tray
let awaken: boolean
let ready: boolean
let readyError: string
let main: Main

if (electron.app.dock) {
	electron.app.dock.hide()
}

process.on("uncaughtException", function (error) {
	let errorMsg: string
	if (error && error.stack) {
		errorMsg = error.stack
	} else {
		errorMsg = String(error)
	}

	if (!ready) {
		readyError = errorMsg
		return
	}

	electron.dialog.showMessageBox(null, {
		type: "error",
		buttons: ["Exit"],
		title: "Pritunl Client - Process Error",
		message: "Error occured in main process:\n\n" + errorMsg,
	}).then(function() {
		electron.app.quit()
	})
})

process.on("unhandledRejection", function (error) {
	let errorMsg: string = String(error)

	if (!ready) {
		readyError = errorMsg
		return
	}

	electron.dialog.showMessageBox(null, {
		type: "error",
		buttons: ["Exit"],
		title: "Pritunl Client - Process Error",
		message: "Error occured in main process:\n\n" + errorMsg,
	}).then(function() {
		electron.app.quit()
	})
})

Service.wakeup().then((awake: boolean) => {
	awaken = awake
	if (ready) {
		init()
	}
})

class Main {
	window: electron.BrowserWindow

	showWindow(): void {
		this.window.show()
	}

	createWindow(): void {
		let width: number
		let height: number
		let minWidth: number
		let minHeight: number
		let maxWidth: number
		let maxHeight: number
		let titleBarStyle: string

		let classicIface = Config.classic_interface

		if (process.platform === "darwin" && classicIface) {
			width = 340
			height = 423
			minWidth = 304
			minHeight = 352
			maxWidth = 540
			maxHeight = 642
		} else {
			width = 420
			height = 528
			minWidth = 405
			minHeight = 440
			maxWidth = 670
			maxHeight = 800
		}

		if (process.platform === "win32" && !classicIface) {
			titleBarStyle = "hidden"
			width = 440
			minWidth = 440
		}

		if (Config.window_width && Config.window_height) {
			width = Config.window_width
			if (width < minWidth) {
				width = minWidth
			}
			height = Config.window_height
			if (height < minHeight) {
				height = minHeight
			}
		}

		let zoomFactor = 1
		if (process.platform === "darwin" && classicIface) {
			zoomFactor = 0.8
		}

		this.window = new electron.BrowserWindow({
			title: "Pritunl Client",
			icon: path.join(__dirname, "..", "logo.png"),
			titleBarStyle: titleBarStyle as any,
			frame: true,
			autoHideMenuBar: true,
			fullscreen: false,
			show: false,
			width: width,
			height: height,
			minWidth: minWidth,
			minHeight: minHeight,
			maxWidth: maxWidth,
			maxHeight: maxHeight,
			backgroundColor: "#151719",
			webPreferences: {
				zoomFactor: zoomFactor,
				devTools: true,
				nodeIntegration: true,
				contextIsolation: false,
			}
		})

		electron.ipcMain.on(
			"control",
			(evt: electron.IpcMainEvent, msg: string) => {
				if (msg === "service-auth-error") {
					electron.dialog.showMessageBox(null, {
						type: "error",
						buttons: ["Exit"],
						title: "Pritunl - Service Error (4827)",
						message: "Failed to load service key. Restart " +
							"computer and verify background service is running",
					}).then(function() {
						electron.app.quit()
					})
				} else if (msg === "service-conn-error") {
					electron.dialog.showMessageBox(null, {
						type: "error",
						buttons: ["Exit"],
						title: "Pritunl - Service Error (2754)",
						message: "Unable to establish communication with " +
							"background service, try restarting computer",
					}).then(function() {
						electron.app.quit()
					})
				} else if (msg === "dev-tools") {
					this.window.webContents.openDevTools({
						"mode": "undocked",
					})
				} else if (msg === "reload") {
					this.window.reload()
				} else if (msg === "minimize") {
					this.window.minimize()
				}
			},
		)

		let windowSize: number[];
		this.window.on("close", (): void => {
			try {
				windowSize = this.window.getSize()
			} catch {}
		})

		this.window.on("closed", async (): Promise<void> => {
			if (windowSize && windowSize.length == 2) {
				Config.window_width = windowSize[0]
				Config.window_height = windowSize[1]
				await Config.save()
			}
			if (Config.disable_tray_icon || !tray) {
				electron.app.quit()
			}
			electron.ipcMain.removeAllListeners("control")
			main = null
		})

		let shown = false
		this.window.on("ready-to-show", (): void => {
			if (shown) {
				return
			}
			shown = true
			this.window.show()

			if (process.argv.indexOf("--dev-tools") !== -1) {
				this.window.webContents.openDevTools({
					"mode": "undocked",
				})
			}
		})
		setTimeout((): void => {
			if (shown) {
				return
			}
			shown = true
			this.window.show()

			if (process.argv.indexOf("--dev-tools") !== -1) {
				this.window.webContents.openDevTools({
					"mode": "undocked",
				})
			}
		}, 800)

		let indexUrl = ""
		if (classicIface) {
			indexUrl = "file://" + path.join(__dirname, "..",
				"index_orig.html")
		} else {
			indexUrl = "file://" + path.join(__dirname, "..",
				"index.html")
		}
		indexUrl += "?dev=" + (process.argv.indexOf("--dev") !== -1 ?
			"true" : "false")
		indexUrl += "&dataPath=" + encodeURIComponent(
			electron.app.getPath("userData"))
		indexUrl += "&notitle=" + (titleBarStyle ? "true" : "false")

		this.window.loadURL(indexUrl, {
			userAgent: "pritunl",
		})

		if (electron.app.dock) {
			electron.app.dock.show()
		}
	}

	run(): void {
		if (main) {
			main.showWindow()
			return
		}

		this.createWindow()
		main = this
	}
}

function initTray() {
	tray = new electron.Tray(getTrayIcon(false))

	tray.on("click", function() {
		let main = new Main()
		main.run()
	})
	tray.on("double-click", function() {
		let main = new Main()
		main.run()
	})

	let trayMenu = electron.Menu.buildFromTemplate([
		{
			label: "Open Pritunl Client",
			click: function () {
				let main = new Main()
				main.run()
			}
		},
		{
			label: "Exit",
			click: function() {
				electron.app.quit()
			}
		}
	])

	tray.setToolTip("Pritunl Client")
	tray.setContextMenu(trayMenu)

	Service.sync().then((status: boolean): void => {
		tray.setImage(getTrayIcon(status))
	})
}

function initAppMenu() {
	let appMenu = electron.Menu.buildFromTemplate([
		{
			label: "Pritunl",
			submenu: [
				{
					label: "Pritunl Client",
				},
				{
					label: "Close",
					accelerator: "CmdOrCtrl+Q",
					role: "close",
				},
				{
					label: "Exit",
					click: function() {
						electron.app.quit()
					},
				},
			],
		},
		{
			label: "Edit",
			submenu: [
				{
					label: "Undo",
					accelerator: "CmdOrCtrl+Z",
					role: "undo",
				},
				{
					label: "Redo",
					accelerator: "Shift+CmdOrCtrl+Z",
					role: "redo",
				},
				{
					type: "separator",
				},
				{
					label: "Cut",
					accelerator: "CmdOrCtrl+X",
					role: "cut",
				},
				{
					label: "Copy",
					accelerator: "CmdOrCtrl+C",
					role: "copy",
				},
				{
					label: "Paste",
					accelerator: "CmdOrCtrl+V",
					role: "paste",
				},
				{
					label: "Select All",
					accelerator: "CmdOrCtrl+A",
					role: "selectall",
				},
			],
		}
	] as any)
	electron.Menu.setApplicationMenu(appMenu)
}

function init() {
	if (awaken === undefined) {
		return
	} else if (awaken) {
		electron.app.quit()
		return
	}

	Config.load().then(() => {
		Service.connect(process.argv.indexOf("--dev") !== -1).then(() => {
			if (process.argv.indexOf("--no-main") !== -1) {
				if (Config.disable_tray_icon) {
					electron.app.quit()
					return
				}
			} else {
				let main = new Main()
				main.run()
			}

			initAppMenu()

			if (!Config.disable_tray_icon) {
				initTray()
			}

			Service.subscribe((event: Service.Event): void => {
				if (event.type === "connected") {
					if (tray) {
						tray.setImage(getTrayIcon(true))
					}
				} else if (event.type === "disconnected") {
					if (tray) {
						tray.setImage(getTrayIcon(false))
					}
				} else if (event.type === "wakeup") {
					Service.send("awake")

					let main = new Main()
					main.run()
				}
			})
		})
	})
}

function getTrayIcon(state: boolean): string {
	let connTray = ""
	let disconnTray = ""

	if (process.platform === "darwin") {
		connTray = path.join(__dirname, "..", "img",
			"tray_connected_osxTemplate.png")
		disconnTray = path.join(__dirname, "..", "img",
			"tray_disconnected_osxTemplate.png")
	} else if (process.platform === "win32") {
		connTray = path.join(__dirname, "..", "img",
			"tray_connected_win.png")
		disconnTray = path.join(__dirname, "..", "img",
			"tray_disconnected_win.png")
	} else if (process.platform === "linux") {
		connTray = path.join(__dirname, "..", "img",
			"tray_connected_linux_light.png")
		disconnTray = path.join(__dirname, "..", "img",
			"tray_disconnected_linux_light.png")
	} else {
		connTray = path.join(__dirname, "..", "img",
			"tray_connected.png")
		disconnTray = path.join(__dirname, "..", "img",
			"tray_disconnected.png")
	}

	if (state) {
		return connTray
	} else {
		return disconnTray
	}
}

electron.app.on("window-all-closed", (): void => {
	try {
		Config.load().then(() => {
			if (Config.disable_tray_icon || !tray) {
				electron.app.quit()
			} else {
				if (electron.app.dock) {
					electron.app.dock.hide()
				}
			}
		})
	} catch (error) {
		throw error
	}
})

electron.app.on("open-file", (): void => {
	try {
		let main = new Main()
		main.run()
	} catch (error) {
		throw error
	}
})

electron.app.on("open-url", (): void => {
	try {
		let main = new Main()
		main.run()
	} catch (error) {
		throw error
	}
})

electron.app.on("activate", (): void => {
	try {
		let main = new Main()
		main.run()
	} catch (error) {
		throw error
	}
})

electron.app.on("quit", (): void => {
	try {
		electron.app.quit()
	} catch (error) {
		throw error
	}
})

electron.app.on("ready", (): void => {
	let profilesPth = path.join(electron.app.getPath("userData"), "profiles")
		fs.exists(profilesPth, function(exists) {
		if (!exists) {
			fs.mkdir(profilesPth, function() {})
		}
	})

	try {
		if (readyError) {
			electron.dialog.showMessageBox(null, {
				type: "error",
				buttons: ["Exit"],
				title: "Pritunl Client - Process Error",
				message: "Error occured in main process:\n\n" + readyError,
			}).then(function() {
				electron.app.quit()
			})
			return
		}

		ready = true
		init()
	} catch (error) {
		throw error
	}
})
