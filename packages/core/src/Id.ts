import baseX from 'base-x'
import {Buffer} from 'buffer'
import getRandomValues from 'get-random-values'

// Source: https://github.com/mofax/mksuid/blob/cde9a6d8a4b5cc5f975a323b336890320da1b23e/src/index.ts
// Edited to:
// - reflect ksuid standard (removed ms precision)
// - use get-random-values for browser compat (to avoid polyfilling crypto 100kb+)

const baseAlpha =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const base62 = baseX(baseAlpha)

const ID_LENGTH = 20
const TIME_LENGTH = 4
const PAYLOAD_LENGTH = 16
const EPOCH_IN_MS = 14e11

function getTime(date = new Date()) {
  const timestamp = Math.floor((date.getTime() - EPOCH_IN_MS) / 1e3)
  const timestampBuffer = Buffer.allocUnsafe(TIME_LENGTH)
  timestampBuffer.writeUInt32BE(timestamp, 0)
  return timestampBuffer
}

function getPayload() {
  const view = new Uint8Array(PAYLOAD_LENGTH)
  const bytes = getRandomValues(view)
  return Buffer.from(bytes)
}

function ksuid(date?: Date) {
  const time = getTime(date)
  const payload = getPayload()
  const id = Buffer.concat([time, payload], ID_LENGTH)
  return base62.encode(id)
}

/** Parse a ksuid into a Date of creation and a Buffer containing the random bits  */
export function parseId(str: string) {
  const buffer = base62.decode(str)
  const id = buffer.length === ID_LENGTH ? buffer : buffer.slice(-ID_LENGTH)
  const timestamp = id.readUInt32BE(0)
  return [
    new Date(1e3 * timestamp + EPOCH_IN_MS),
    Buffer.from(id.slice(TIME_LENGTH, ID_LENGTH))
  ] as const
}

/** Create a ksuid  */
export const createId = (): string => ksuid()
