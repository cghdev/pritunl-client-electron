/// <reference path="../References.d.ts"/>
import * as Errors from "../Errors"
import fs from "fs";
import tar from "tar";
import childProcess from "child_process";

export function uuid(): string {
	return (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
}

export function uuidRand(): string {
	let id = ""

	for (let i = 0; i < 4; i++) {
		id += Math.floor((1 + Math.random()) * 0x10000).toString(
			16).substring(1);
	}

	return id;
}

export function nonce(): string {
	let nonce = ''

	for (let i = 0; i < 8; i++) {
		nonce += Math.floor((1 + Math.random()) * 0x10000).toString(
			16).substring(1)
	}

	return nonce
}

export function shuffle(n: any[]): any[] {
	let i = n.length, j
	while (i != 0) {
		j = Math.floor(Math.random() * i)
		i--
		[n[i], n[j]] = [n[j], n[i]]
	}
	return n
}

export function objectIdNil(objId: string): boolean {
	return !objId || objId == '000000000000000000000000';
}

export function zeroPad(num: number, width: number): string {
	if (num < Math.pow(10, width)) {
		return ('0'.repeat(width - 1) + num).slice(-width);
	}
	return num.toString();
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatAmount(amount: number): string {
	if (!amount) {
		return '-';
	}
	return '$' + (amount / 100).toFixed(2);
}

export function formatDate(dateData: any): string {
	if (!dateData || dateData === '0001-01-01T00:00:00Z') {
		return '';
	}

	let date: Date;
	if (dateData instanceof String) {
		date = new Date(dateData as string);
	} else {
		date = new Date(0)
		date.setUTCSeconds(dateData as number)
	}

	let str = '';

	let hours = date.getHours();
	let period = 'AM';

	if (hours > 12) {
		period = 'PM';
		hours -= 12;
	} else if (hours === 0) {
		hours = 12;
	}

	let day;
	switch (date.getDay()) {
		case 0:
			day = 'Sun';
			break;
		case 1:
			day = 'Mon';
			break;
		case 2:
			day = 'Tue';
			break;
		case 3:
			day = 'Wed';
			break;
		case 4:
			day = 'Thu';
			break;
		case 5:
			day = 'Fri';
			break;
		case 6:
			day = 'Sat';
			break;
	}

	let month;
	switch (date.getMonth()) {
		case 0:
			month = 'Jan';
			break;
		case 1:
			month = 'Feb';
			break;
		case 2:
			month = 'Mar';
			break;
		case 3:
			month = 'Apr';
			break;
		case 4:
			month = 'May';
			break;
		case 5:
			month = 'Jun';
			break;
		case 6:
			month = 'Jul';
			break;
		case 7:
			month = 'Aug';
			break;
		case 8:
			month = 'Sep';
			break;
		case 9:
			month = 'Oct';
			break;
		case 10:
			month = 'Nov';
			break;
		case 11:
			month = 'Dec';
			break;
	}

	str += day + ' ';
	str += date.getDate() + ' ';
	str += month + ' ';
	str += date.getFullYear() + ', ';
	str += hours + ':';
	str += zeroPad(date.getMinutes(), 2) + ':';
	str += zeroPad(date.getSeconds(), 2) + ' ';
	str += period;

	return str;
}

export function formatDateLess(dateData: any): string {
	if (!dateData || dateData === '0001-01-01T00:00:00Z') {
		return '';
	}

	let date: Date;
	if (dateData instanceof String) {
		date = new Date(dateData as string);
	} else {
		date = new Date(0)
		date.setUTCSeconds(dateData as number)
	}

	let str = '';

	let hours = date.getHours();
	let period = 'AM';

	if (hours > 12) {
		period = 'PM';
		hours -= 12;
	} else if (hours === 0) {
		hours = 12;
	}

	let month;
	switch (date.getMonth()) {
		case 0:
			month = 'Jan';
			break;
		case 1:
			month = 'Feb';
			break;
		case 2:
			month = 'Mar';
			break;
		case 3:
			month = 'Apr';
			break;
		case 4:
			month = 'May';
			break;
		case 5:
			month = 'Jun';
			break;
		case 6:
			month = 'Jul';
			break;
		case 7:
			month = 'Aug';
			break;
		case 8:
			month = 'Sep';
			break;
		case 9:
			month = 'Oct';
			break;
		case 10:
			month = 'Nov';
			break;
		case 11:
			month = 'Dec';
			break;
	}

	str += month + ' ';
	str += date.getDate() + ' ';
	str += date.getFullYear() + ', ';
	str += hours + ':';
	str += zeroPad(date.getMinutes(), 2);
	str += period;

	return str;
}

export function formatDateShort(dateData: any): string {
	if (!dateData || dateData === '0001-01-01T00:00:00Z') {
		return '';
	}

	let date: Date
	if (dateData instanceof String) {
		date = new Date(dateData as string)
	} else {
		date = new Date(0)
		date.setUTCSeconds(dateData as number)
	}

	let curDate = new Date();

	let month;
	switch (date.getMonth()) {
		case 0:
			month = 'Jan';
			break;
		case 1:
			month = 'Feb';
			break;
		case 2:
			month = 'Mar';
			break;
		case 3:
			month = 'Apr';
			break;
		case 4:
			month = 'May';
			break;
		case 5:
			month = 'Jun';
			break;
		case 6:
			month = 'Jul';
			break;
		case 7:
			month = 'Aug';
			break;
		case 8:
			month = 'Sep';
			break;
		case 9:
			month = 'Oct';
			break;
		case 10:
			month = 'Nov';
			break;
		case 11:
			month = 'Dec';
			break;
	}

	let str = month + ' ' + date.getDate();

	if (date.getFullYear() !== curDate.getFullYear()) {
		str += ' ' + date.getFullYear();
	}

	return str;
}

export function formatDateShortTime(dateData: any): string {
	if (!dateData || dateData === '0001-01-01T00:00:00Z') {
		return '';
	}

	let date: Date
	if (dateData instanceof String) {
		date = new Date(dateData as string)
	} else {
		date = new Date(0)
		date.setUTCSeconds(dateData as number)
	}

	let curDate = new Date();

	let month;
	switch (date.getMonth()) {
		case 0:
			month = 'Jan';
			break;
		case 1:
			month = 'Feb';
			break;
		case 2:
			month = 'Mar';
			break;
		case 3:
			month = 'Apr';
			break;
		case 4:
			month = 'May';
			break;
		case 5:
			month = 'Jun';
			break;
		case 6:
			month = 'Jul';
			break;
		case 7:
			month = 'Aug';
			break;
		case 8:
			month = 'Sep';
			break;
		case 9:
			month = 'Oct';
			break;
		case 10:
			month = 'Nov';
			break;
		case 11:
			month = 'Dec';
			break;
	}

	let str = month + ' ' + date.getDate();

	if (date.getFullYear() !== curDate.getFullYear()) {
		str += ' ' + date.getFullYear();
	} else if (date.getMonth() === curDate.getMonth() &&
			date.getDate() === curDate.getDate()) {
		let hours = date.getHours();
		let period = 'AM';

		if (hours > 12) {
			period = 'PM';
			hours -= 12;
		} else if (hours === 0) {
			hours = 12;
		}

		str = hours + ':';
		str += zeroPad(date.getMinutes(), 2) + ':';
		str += zeroPad(date.getSeconds(), 2) + ' ';
		str += period;
	}

	return str;
}

export interface ExecOutput {
	stdout: string
	stderr: string
	error: Errors.ExecError
}

export function exec(path: string,
	...args: string[]): Promise<ExecOutput> {

	return new Promise<ExecOutput>((resolve): void => {
		childProcess.execFile(path, args, (err, stdout, stderr) => {
			if (err) {
				err = new Errors.ExecError(err, "Utils: Exec error");
			}

			resolve({
				stdout: stdout,
				stderr: stderr,
				error: err,
			} as ExecOutput)
		})
	})
}

export function fileSize(path: string): Promise<number> {
	return new Promise<number>((resolve): void => {
		fs.stat(path, (err: Error, stat) => {
			if (err || !stat) {
				resolve(0)
			}
			resolve(stat.size || 0)
		})
	})
}

export function fileDelete(path: string): Promise<void> {
	return new Promise<void>((resolve, reject): void => {
		fs.exists(path, (exists: boolean): void => {
			if (!exists) {
				resolve()
				return
			}
			fs.unlink(path, (err) => {
				if (err) {
					err = new Errors.WriteError(err, "Utils: Failed to delete file");
					reject(err)
					return
				}
				resolve()
			})
		})
	})
}

export function fileRead(path: string): Promise<string> {
	return new Promise<string>((resolve, reject): void => {
		fs.readFile(
			path, "utf-8",
			(err: NodeJS.ErrnoException, data: string): void => {
				if (err) {
					err = new Errors.ReadError(err, "Utils: Failed to read file");
					reject(err)
					return
				}

				resolve(data)
			},
		)
	})
}

export function fileWrite(path: string, data: string): Promise<void> {
	return new Promise<void>((resolve, reject): void => {
		fs.writeFile(
			path, data,
			(err: NodeJS.ErrnoException): void => {
				if (err) {
					err = new Errors.WriteError(err, "Utils: Failed to write file");
					reject(err)
					return
				}
				resolve()
			},
		)
	})
}

export interface TarData {
	path: string
	data: string
}

export function tarRead(path: string): Promise<TarData[]> {
	return new Promise<TarData[]>((resolve, reject): void => {
		try {
			let files: TarData[] = []
			let parser = new tar.Parse()

			fs.createReadStream(path)
				.pipe(parser)
				.on("entry", (entry) => {
					let data = ""

					entry.on("data", (content) => {
						data += content.toString()
					})
					entry.on("end", () => {
						files.push({
							path: entry.path,
							data: data,
						})
					})
				})
				.on("end", () => {
					resolve(files)
				})
		} catch(err) {
			err = new Errors.ReadError(err, "Utils: Failed to read tar file");
			reject(err)
		}
	})
}
