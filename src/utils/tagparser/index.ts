import { decode, getBuffer, getBytes } from "./helpers"
import parseFlacFile from "./parseFlacFile"
import parseM4aFile from "./parseM4aFile"
import parseMp3File from "./parseMp3File"
import parseOggOpusFile from "./parseOggOpusFile"
import parseWavFile from "./parseWavFile"

// http://id3lib.sourceforge.net/id3/id3v2com-00.html
function getID3TagSize(buffer: ArrayBuffer) {
  const bytes = getBytes(buffer, 6, 4)
  return bytes[0] * 2097152 + bytes[1] * 16384 + bytes[2] * 128 + bytes[3]
}

async function parseFile(file: string, buffer: ArrayBuffer) {
  const bytes = getBytes(buffer, 0, 8)
  const string = decode(bytes)

  if (string.startsWith("ID3")) {
    if (bytes[3] < 3) {
      throw new Error("Unsupported ID3 tag version")
    }
    // +10 to skip tag header
    const size = getID3TagSize(buffer) + 10
    const string = decode(getBytes(buffer, size, 4))

    // Edge case when there is ID3 tag embedded in .flac file.
    // Instead of parsing ID3 tag - ignore it and treat it as normal .flac file.
    if (string === "fLaC") {
      return parseFlacFile(file, buffer, size + 4)
    }
    return parseMp3File(file, buffer, bytes[3])
  } else if (string.startsWith("fLaC")) {
    return parseFlacFile(file, buffer)
  } else if (string.startsWith("OggS")) {
    buffer = await getBuffer(file)
    return parseOggOpusFile(buffer)
  } else if (string.endsWith("ftyp")) {
    buffer = await getBuffer(file)
    return parseM4aFile(buffer)
  } else if (string.startsWith("RIFF")) {
    return parseWavFile(buffer)
  }
  throw new Error("Invalid or unsupported file")
}

async function parseAudioMetadata(url: string) {
  const buffer = await getBuffer(url, 512 * 1024 - 1)

  return parseFile(url, buffer)
}

export default parseAudioMetadata
